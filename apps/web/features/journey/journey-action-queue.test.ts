import {afterEach,beforeEach,expect,test,vi} from 'vitest';
const {command,reload,identity}=vi.hoisted(()=>({command:vi.fn(),reload:vi.fn(),identity:vi.fn()}));
vi.mock('../../lib/economy/client',()=>({economyClient:{journey:command}}));
vi.mock('../../lib/supabase/online-sync',()=>({ONLINE_CACHE_EVENT:'test-cache',getCurrentOnlineUserId:identity,reloadOnlineTraveler:reload,queueOnlineTravelerSync:vi.fn(),canUseTravelerInCurrentSession:()=>true,createOnlineTraveler:vi.fn(),selectOnlineTraveler:vi.fn()}));
import {runOnlineJourneyAction} from './state/use-journey';
import {journeyRepository} from './persistence/journey-storage';
import {createTraveler,DEFAULT_APPEARANCE} from './domain/traveler';
let id:string;
beforeEach(()=>{
 const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>values.delete(k)};
 vi.stubGlobal('window',{localStorage:storage,dispatchEvent:vi.fn()});vi.stubGlobal('localStorage',storage);
 identity.mockReset();identity.mockReturnValue('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');command.mockReset();command.mockResolvedValue({progress:{gardenStep:'explore'}});reload.mockReset();reload.mockResolvedValue(true);
 id=crypto.randomUUID();expect(journeyRepository.saveNew(createTraveler('Sintetico',DEFAULT_APPEARANCE,id,'2026-10-17T00:00:00.000Z'))).toBe(true);expect(journeyRepository.startSession(id)).toBe(true);
});
afterEach(()=>vi.unstubAllGlobals());
test('a lost response retains the same operation ID and never credits a local snapshot',async()=>{
 command.mockRejectedValueOnce(Error('lost response'));
 await expect(runOnlineJourneyAction({type:'advance',step:'explore'})).rejects.toThrow('lost response');
 await runOnlineJourneyAction({type:'advance',step:'explore'});
 expect(command.mock.calls[0][1]).toBe(command.mock.calls[1][1]);
 expect(journeyRepository.load()).toMatchObject({status:'ready',traveler:{coins:0,xp:0}});
});
test('a confirmed operation with failed cache refresh remains retryable with its original ID',async()=>{
 reload.mockResolvedValueOnce(false);
 await expect(runOnlineJourneyAction({type:'advance',step:'explore'})).rejects.toThrow('cache');
 await runOnlineJourneyAction({type:'advance',step:'explore'});
 expect(command.mock.calls[0][1]).toBe(command.mock.calls[1][1]);
});
test('an account switch while the response is pending cannot refresh the new account cache',async()=>{
 let deliver:(v:unknown)=>void=()=>{};
 command.mockImplementationOnce(()=>new Promise(r=>{deliver=r;}));
 const task=runOnlineJourneyAction({type:'advance',step:'explore'});
 await vi.waitFor(()=>expect(command).toHaveBeenCalledTimes(1));identity.mockReturnValue('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');deliver({progress:{gardenStep:'explore'}});
 await expect(task).rejects.toThrow('sessão');expect(reload).not.toHaveBeenCalled();
});
