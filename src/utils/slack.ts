import {WebClient} from '@slack/web-api';

export const createSlackclient = (token: string) => {
  return new WebClient(token);
};

export const createMonthlyReportBlocks = async (
  monthlyReports: any,
  lastmonth: string,
  mode: string
) => {
  const blocks: any = [];
  if (mode !== 'pre') {
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `:通知fox:${lastmonth}の月報をお届けします`,
        emoji: true,
      },
    });
  } else {
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `:通知fox:${lastmonth}の速報をお届けします`,
        emoji: true,
      },
    });
    blocks.push({
      type: 'section',
      text: {
        type: 'plain_text',
        text: 'free勤怠の稼働時間を確認の上、双方に修正・申請をお願いします。',
        emoji: true,
      },
    });
    monthlyReports.splice(1);
  }
  for (const report of monthlyReports) {
    const text = Object.keys(report.users)
      .map(key => `- ${key} (${Math.round(report.users[key])}h)\n`)
      .join('');
    blocks.push(
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${report.name}（${Math.round(report.hours)}h）`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text,
        },
      },
      {
        type: 'divider',
      }
    );
  }
  return blocks;
};
