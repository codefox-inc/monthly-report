import {Client} from '@notionhq/client';

export const createNotionClient = (token: string) => {
  return new Client({auth: token});
};

export const getRawDailyReport = async (
  notion: Client,
  nippodb_id: string,
  after: string,
  before: string
): Promise<any> => {
  let results: any = [];
  let has_more = true;
  let next_cursor: string | null = null;

  while (has_more) {
    const response: any = await notion.databases.query({
      start_cursor: next_cursor || undefined,
      database_id: nippodb_id,
      filter: {
        and: [
          {
            property: '日付',
            date: {
              on_or_before: before,
            },
          },
          {
            property: '日付',
            date: {
              on_or_after: after,
            },
          },
        ],
      },
      sorts: [
        {
          property: 'ユーザー',
          direction: 'ascending',
        },
        {
          property: '作成日時',
          direction: 'descending',
        },
      ],
    });

    results = results.concat(response.results);
    has_more = response.has_more;
    next_cursor = response.next_cursor;
  }
  return results;
};

export const getProjects = async (
  notion: Client,
  pjdb_id: string
  ): Promise<any> => {
  const results: any = {};
  let has_more = true;
  let next_cursor: string | null = null;

  while (has_more) {
    const response: any = await notion.databases.query({
      start_cursor: next_cursor || undefined,
      database_id: pjdb_id,
    });

    for (const result of response.results) {
      results[result.id] = {
        id: result.id,
        name: result.properties['プロジェクト名'].title[0]?.plain_text,
        parent: result.properties['親プロジェクト'].relation[0]?.id,
      };
    }
    has_more = response.has_more;
    next_cursor = response.next_cursor;
  }

  return results;
};

export const replaceIdToName = async (
  notion: Client,
  dailyReport: any
) => {
  const users = await notion.users.list({page_size: 100});
  users['results'].forEach((user): any => {
    if (dailyReport[user['id']]) {
      dailyReport[user['name']!] = dailyReport[user['id']];
      delete dailyReport[user['id']];
    }
  });
  return dailyReport;
};
