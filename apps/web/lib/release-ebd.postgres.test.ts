import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  offlinePostgres,
  uid,
  tid,
  literal,
} from '../../../tests/fixtures/offline-authority-postgres';
import { blankLesson } from '../features/guild-ebd/contracts';
const db = offlinePostgres();
const migration =
  'supabase/migrations/20261024151503_release_ebd_001_isolation.sql';
const lesson = '20000000-0000-4000-8000-000000000001',
  activity = '30000000-0000-4000-8000-000000000001',
  answer = '40000000-0000-4000-8000-000000000001';
let guild = '';
let recovery = '';
const recoveryQuery = readFileSync('tests/fixtures/release-ebd-recovery.sql', 'utf8');
const command = (
  actor: number,
  action: string,
  id: string,
  rev: number,
  p: object,
) =>
  db.as(
    actor,
    `SELECT public.guild_ebd_command('${tid(actor)}','${action}','${id}',${rev},${literal(p)})`,
  );
const workspace = (actor: number) =>
  JSON.parse(
    db.as(actor, `SELECT public.guild_ebd_workspace('${tid(actor)}',0)`),
  );
const balances = () =>
  db.query(
    `SELECT md5(string_agg(x::text,'' ORDER BY x::text)) FROM (SELECT jsonb_build_array(t.id,t.xp,t.level,w.coins) x FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id) a`,
  );
describe.runIf(process.env.RPG_LOCAL_PG === '1')(
  'RELEASE-EBD-001 isolated database boundary',
  () => {
    beforeAll(async () => {
      await db.start();
      db.apply('consolidation004-expand0078.sql');
      db.apply('consolidation004-authority.sql');
      for (let n = 1; n <= 5; n++) {
        db.query(`INSERT INTO auth.users(id)VALUES('${uid(n)}')`);
        db.as(
          n,
          `SELECT public.create_traveler('${tid(n)}','EBD Fixture ${n}','female','medio','curto','castanho','musgo')`,
        );
      }
      recovery = db.query(recoveryQuery);
      const before = balances();
      db.query(`BEGIN;${readFileSync(migration, 'utf8')}COMMIT;`);
      expect(balances()).toBe(before);
    }, 120000);
    afterAll(() => db.stop());
    it('preserves existing resources and creates a new avatar without economic grants or leadership', () => {
      expect(
        db.query(
          `SELECT count(*)FROM public.inventory WHERE traveler_id='${tid(1)}'`,
        ),
      ).toBe('1');
      db.query(`INSERT INTO auth.users(id)VALUES('${uid(6)}')`);
      db.as(
        6,
        `INSERT INTO public.profiles(id,display_name)VALUES('${uid(6)}','EBD profile');SELECT public.create_traveler('${tid(6)}','New EBD Avatar','female','medio','curto','castanho','musgo')`,
      );
      expect(
        db.query(
          `SELECT xp||':'||level||':'||(SELECT coins FROM public.wallets WHERE traveler_id=t.id) FROM public.travelers t WHERE id='${tid(6)}'`,
        ),
      ).toBe('0:1:0');
      for (const table of [
        'inventory',
        'equipped_items',
        'traveler_chests',
        'guild_members',
      ])
        expect(
          db.query(
            `SELECT count(*)FROM public.${table} WHERE traveler_id='${tid(6)}'`,
          ),
        ).toBe('0');
      db.as(
        6,
        `UPDATE public.travelers SET name='Renamed avatar'WHERE id='${tid(6)}'`,
      );
});
    it('denies all direct economic columns and RPCs, even when the actor owns the avatar', async () => {
      const before = balances();
      for (const sql of [
        `UPDATE public.travelers SET xp=xp+16 WHERE id='${tid(1)}'`,
        `UPDATE public.travelers SET level=50 WHERE id='${tid(1)}'`,
        `UPDATE public.wallets SET coins=coins+6 WHERE traveler_id='${tid(1)}'`,
        `INSERT INTO public.inventory VALUES('${tid(1)}','forged',1)`,
        `SELECT public.open_chest('${tid(1)}','common','${answer}')`,
        `SELECT public.complete_story('${tid(1)}','garden')`,
        `SELECT public.economy_authority('${uid(1)}','${tid(1)}','collection','{}')`,
      ])
        expect(() => db.as(1, sql)).toThrow();
      await expect(db.rpc(uid(1), tid(1), 'starter')).rejects.toThrow();
      expect(balances()).toBe(before);
    });
    it('creates leadership only through the owned-avatar guild creation action and approves membership', () => {
      expect(
        db.query(
          `SELECT count(*) FROM public.guild_members WHERE traveler_id='${tid(1)}'`,
        ),
      ).toBe('0');
      expect(() =>
        db.as(2, `SELECT public.create_guild('${tid(1)}','Forged guild','')`),
      ).toThrow();
      guild = db.as(
        1,
        `SELECT public.create_guild('${tid(1)}','EBD isolated guild','Test fixture')`,
      );
      for (const n of [2, 3]) {
        const request = db.as(
          n,
          `SELECT public.request_join_guild('${guild}','${tid(n)}')`,
        );
        db.as(
          1,
          `SELECT public.review_guild_join_request('${request}','${tid(1)}',true)`,
        );
      }
      expect(
        db.query(
          `SELECT role FROM public.guild_members WHERE traveler_id='${tid(1)}'`,
        ),
      ).toBe('leader');
      expect(
        db.query(
          `SELECT role FROM public.guild_members WHERE traveler_id='${tid(2)}'`,
        ),
      ).toBe('member');
      db.as(
        4,
        `SELECT public.create_guild('${tid(4)}','Other isolated guild','Test fixture')`,
      );
    });
    it('supports leader-designated teachers, scheduled lessons and publication with no economic dependency', () => {
      expect(() =>
        command(2, 'teacher', tid(3), 0, {
          active: true,
          publish: true,
          attend: true,
        }),
      ).toThrow();
      command(1, 'teacher', tid(2), 0, {
        active: true,
        publish: true,
        attend: true,
      });
      const input = {
        ...blankLesson(tid(2)),
        title: 'Release lesson',
        theme: 'Fixture theme',
        content: 'Synthetic educational content',
        scheduledAt: '2026-12-20T12:00:00Z',
      };
      expect(() =>
        command(2, 'lesson', lesson, 0, { ...input, rewardTier: 'epic' }),
      ).toThrow();
      command(2, 'lesson', lesson, 0, input);
      command(2, 'lesson', lesson, 1, {
        ...input,
        title: 'Edited release lesson',
      });
      command(2, 'activity', activity, 0, {
        lessonId: lesson,
        title: 'Release quiz',
        kind: 'choice',
        prompt: 'Choose the fixture answer',
        options: ['First', 'Second'],
        answerKey: 1,
        deadline: '',
        attemptLimit: 2,
        criterion: 'correct',
      });
      command(2, 'state', lesson, 2, { state: 'published' });
      expect(workspace(3).lessons[0].title).toBe('Edited release lesson');
      expect(workspace(4).lessons).toEqual([]);
    });
    it('accepts a real quiz submission and attendance while preventing legacy reward-pending insertion', () => {
      const before = balances();
      // Legacy non-null reward remains in the synthetic lesson to test isolation without a backfill.
      db.query(
        `UPDATE public.guild_lessons SET reward_tier='normal' WHERE id='${lesson}'`,
      );
      command(3, 'submit', answer, 0, {
        activityId: activity,
        response: 'Second',
        choice: 1,
      });
      command(2, 'attendance', lesson, 0, {
        travelerId: tid(3),
        status: 'present',
        note: 'Fixture presence',
      });
      expect(workspace(3).answers[0].status).toBe('completed');
      expect(workspace(3).attendance).toHaveLength(1);
      expect(
        db.query('SELECT count(*)FROM public.guild_ebd_reward_pending'),
      ).toBe('0');
      expect(balances()).toBe(before);
      expect(workspace(2).history.length).toBeGreaterThan(0);
    });
    it('denies a student, another guild and anonymous calls to leadership or EBD mutations', () => {
      expect(() =>
        command(3, 'state', lesson, 3, { state: 'closed' }),
      ).toThrow();
      expect(() =>
        command(4, 'attendance', lesson, 0, {
          travelerId: tid(3),
          status: 'present',
          note: '',
        }),
      ).toThrow();
      expect(() =>
        db.query(
          `BEGIN;SET LOCAL ROLE anon;SELECT public.create_guild('${tid(1)}','Bad guild','');ROLLBACK;`,
        ),
      ).toThrow();
      expect(
        db.query(
          `SELECT count(*)FROM public.guild_members WHERE traveler_id='${tid(3)}' AND role='leader'`,
        ),
      ).toBe('0');
    });
    it('restores every changed grant and function without changing player data', () => {
      const before = balances();
      db.query(recovery);
      expect(db.query(recoveryQuery)).toBe(recovery);
      expect(balances()).toBe(before);
      expect(workspace(3).answers[0].status).toBe('completed');
      expect(db.query("SELECT to_regnamespace('release_ebd') IS NULL")).toBe('t');
    });
  },
);
