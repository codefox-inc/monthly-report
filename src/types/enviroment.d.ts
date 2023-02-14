declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NOTION_TOKEN: string;
      NOTION_NippoDB_ID: string;
      NOTION_PJDB_ID: string;
      SLACK_TOKEN: string;
    }
  }
}

export {};
