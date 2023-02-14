import * as dotenv from 'dotenv';
import {DateTime} from 'luxon';
import {
  createNotionClient,
  getProjects,
  getRawDailyReport,
} from './utils/notion';
import type {HttpFunction} from '@google-cloud/functions-framework';

import {createMonthlyReportBlocks, createSlackclient} from './utils/slack';

dotenv.config();

//日報のプロジェクトが記載されていたら親まで遡りPJidを取得
const getParentProjects = (projects: any, project: any) => {
  if (project === undefined) {
    return [];
  }

  const results: any = [project.id];
  while (project?.parent) {
    project = projects[project.parent];
    results.push(project.id);
  }
  return results;
};

// 指定したプロジェクトを親に持つプロジェクトを探索する
const getProjectsHasParent = (projects: any, projectid: string | undefined) => {
  const result: any = Object.values(projects).filter(
    (project: any) => project.parent === projectid
  );
  return result;
};

export const exec: HttpFunction = async (req, res) => {
  // 対象日の算出（先月）
  const lastmonth = DateTime.now()
    .setZone('Asia/Tokyo')
    .plus({months: -1})
    .set({
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

  const startDate = lastmonth.toISO();
  const endDate = lastmonth.plus({months: 1}).toISO();

  console.log(`startDate: ${startDate}`);
  console.log(`endDate: ${endDate}`);

  // Notionクライアントを取得
  const notionClient = createNotionClient(process.env.NOTION_TOKEN);

  // notionからプロジェクトデータを取得
  const projects = await getProjects(
    notionClient,
    process.env.NOTION_PJDB_ID
    );

  // notionから日報データを取得
  const rawDailyReport = await getRawDailyReport(
    notionClient,
    process.env.NOTION_NippoDB_ID,
    startDate,
    endDate
  );

  const monthlyReport: any = {};

  // 日報データを1行ずつ取得
  for (const result of rawDailyReport) {
    // 対象のプロジェクト（親まで遡る）を取得
    const project = projects[result.properties['プロジェクト'].relation[0]?.id];
    const projectIds = getParentProjects(projects, project);

    const data = {
      hours: result.properties['時間数'].number || 0,
      text: result.properties['やること'].title[0]?.plain_text || '(未記入)',
    };

    // 親までさかのぼって取得したproject_idに集計用データを記録
    for (const project_id of projectIds) {
      for (const user of result.properties['ユーザー'].people) {
        if (!monthlyReport[project_id]) {
          monthlyReport[project_id] = {
            name: projects[project_id].name,
            hours: 0,
            users: {},
            tasks: [],
          };
        }
        // 時間を追加
        monthlyReport[project_id].hours += data.hours;
        // ユーザーごとの時間を加算
        if (!monthlyReport[project_id].users[user.name]) {
          monthlyReport[project_id].users[user.name] = 0;
        }
        monthlyReport[project_id].users[user.name] += data.hours;

        monthlyReport[project_id].tasks.push({
          name: user.name,
          hours: data.hours,
          task: data.text,
        });
      }
    }
  }

  // projectをparentが無いものから順に下っていき、プロジェクトサマリを作成
  const projectSummary: any = [];

  let nextProjects: any = getProjectsHasParent(projects, undefined);

  const maxDepth = 3;
  let currentDepth = 0;

  while (nextProjects.length) {
    currentDepth += 1;
    const targetProjects: any = Array.from(nextProjects);
    nextProjects.splice(0);
    for (const project of targetProjects) {
      const targetReport = monthlyReport[project.id];
      if (targetReport != undefined) {
        projectSummary.push(targetReport);
      }
      if (currentDepth < maxDepth) {
        nextProjects = nextProjects.concat(
          getProjectsHasParent(projects, project.id)
        );
      }
    }
  }

  // slackClientを生成し、createDailyReportBlocksで作ったメッセージ本文を発出
  const slackClient = createSlackclient(process.env.SLACK_TOKEN);
  const mode = (req.query.mode as string) || 'full';
  const blocks = await createMonthlyReportBlocks(
    projectSummary,
    lastmonth.toFormat('MM月'),
    mode
  );

  const channel = mode === 'priv' ? 'priv_日報サマリー' : 'n_日報';

  while (blocks.length > 0) {
    await slackClient.chat.postMessage({
      channel: channel,
      text: '先月の日報サマリーをお届けします。',
      blocks: blocks.splice(0, 50),
    });
  }
  res.send('Success!');
};
