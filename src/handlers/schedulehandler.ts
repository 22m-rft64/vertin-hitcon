import { VertinClient } from "@discordutils/vertinclient";
import { createLogger } from "@discordutils/logger";
import * as schedule from "node-schedule";

const log = createLogger('Scheduler');

export class ScheduleHandler {
  private client: VertinClient;
  private jobs: Map<string, schedule.Job>;

  constructor(client: VertinClient) {
    this.client = client;
    this.jobs = new Map();
  }

  public registerJob(name: string, cron: string, fn: () => Promise<void>): void {
    const existing = this.jobs.get(name);
    if (existing) existing.cancel();

    const job = schedule.scheduleJob(cron, async () => {
      try {
        await fn();
      } catch (error) {
        log.error('Job %s failed', name, error);
      }
    });
    this.jobs.set(name, job);
  }

  /**
   * 특정 시각에 한 번만 실행되는 job을 등록한다.
   * 이미 지난 시각이면 무시.
   */
  public registerOneShot(name: string, date: Date, fn: () => Promise<void>): void {
    if (date.getTime() <= Date.now()) return;

    const existing = this.jobs.get(name);
    if (existing) existing.cancel();

    const job = schedule.scheduleJob(date, async () => {
      try {
        await fn();
      } catch (error) {
        log.error('OneShot job %s failed', name, error);
      }
      this.jobs.delete(name);
    });

    if (job) {
      this.jobs.set(name, job);
    }
  }

  public cancelJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.cancel();
      this.jobs.delete(name);
    }
  }
}
