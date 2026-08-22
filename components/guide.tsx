// 使用说明 —— 一页说清「这个 App 怎么用」。
//
// 【为什么需要它】
// 之前每一页都有「怎么用这一页」（/practice 的右栏就是），但没有一页回答
// 「整体怎么用 / 每天怎么安排 / 考前一周怎么冲」。用户第一次打开时
// 得靠自己摸索这四条主线的关系，那是浪费。
//
// 【为什么是服务端组件】
// 纯展示，没有 hook。数量一律从 NAV / DRILLS / CODING / ARENA 派生，
// 不写死 —— 加一门课这一页自己就对了。

import Link from "next/link";
import { ARENA, CODING, DRILLS, NAV } from "@/content/nav";
import { MODES } from "@/lib/modes";
import { Ladder } from "./ladder";
import { T } from "./t";

const totalLessons = NAV.reduce((n, e) => n + e.lessonCount, 0);
const totalExercises = NAV.reduce((n, e) => n + e.exerciseCount, 0);
const totalMinutes = NAV.reduce((n, e) => n + e.minutes, 0);
const sandboxCount = CODING.filter((c) => c.hasSandbox).length;

export function Guide() {
  return (
    <main className="main" data-rail="off">
      <div className="content">
        <div className="eyebrow">
          <T zh="使用说明" en="How to use this" />
        </div>
        <h1 className="page-title display">
          <T zh="怎么用这个 App" en="How to use DrillLab" />
        </h1>
        <p className="page-lede">
          <T
            zh="一页说清：有哪些东西、按什么顺序走、每天怎么用、考前一周怎么冲。读完这一页就不用再摸索了。"
            en="One page: what is here, in what order to go through it, how to use it day to day, and how to sprint the week before an assessment."
          />
        </p>
        <p className="guide-note">
          <T
            zh={
              <>
                <strong>不想读整页也行。</strong>顶栏那四项就是这个站的四种用法 ——
                学课程 / 背知识点 / 做练习 / 模拟考试。挑一个点进去，左边那栏
                会告诉你在这件事里你在哪、下一步是什么。
              </>
            }
            en={
              <>
                <strong>You do not have to read all of this.</strong> The four items in
                the header are the four ways to use this site — Learn, Review, Practice
                and Assess. Pick one; the sidebar then tells you where you are inside it
                and what comes next.
              </>
            }
          />
        </p>

        {/* ---------------- 一、这里有什么 ---------------- */}
        <section className="guide-sec">
          <h2 className="guide-h">
            <T zh="一、这里有什么" en="1. What is here" />
          </h2>
          <p>
            <T
              zh={
                <>
                  材料一共这么多：{NAV.length} 门课、{totalLessons} 节课文
                  （约 {Math.round(totalMinutes / 60)} 小时）、{totalExercises} 个课内练习、
                  {DRILLS.length} 道面试问答、{CODING.length} 道 coding 题、
                  {ARENA.length} 道计时考场题。它们按「你想做哪一类事」分成四项，
                  就是顶栏那四个：
                </>
              }
              en={
                <>
                  Here is everything: {NAV.length} courses, {totalLessons} written lessons
                  (about {Math.round(totalMinutes / 60)} hours), {totalExercises} in-lesson
                  exercises, {DRILLS.length} interview questions, {CODING.length} coding
                  problems and {ARENA.length} timed papers. They are grouped by what you
                  want to do, which is what the four header items are:
                </>
              }
            />
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <T zh="顶栏那一项" en="Header item" />
                  </th>
                  <th>
                    <T zh="点进去做什么" en="What you do there" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODES.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={m.href}>
                        <T zh={m.zh} en={m.en} />
                      </Link>
                    </td>
                    <td>
                      <T zh={m.blurbZh} en={m.blurbEn} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <T
              zh={
                <>
                  「做练习」里还有两档（课内练习 / 整套 Coding 题），
                  「模拟考试」里还有两种（从零重写 / 模拟考）。
                  区分它们的不是题型，还是<strong>给你多少东西</strong>：
                </>
              }
              en={
                <>
                  Practice holds two tiers (lesson exercises and whole coding problems),
                  and Assess holds two kinds (rebuilds and full mocks). What separates
                  them is still not the kind of problem but{" "}
                  <strong>how much you are handed</strong>:
                </>
              }
            />
          </p>
          <Ladder current="exercises" />
        </section>

        {/* ---------------- 二、按什么顺序 ---------------- */}
        <section className="guide-sec">
          <h2 className="guide-h">
            <T zh="二、第一次来，按这个顺序" en="2. First time here: this order" />
          </h2>
          <ol className="guide-steps">
            <li>
              <strong>
                <T zh="从第一门课的第一节开始。" en="Start at lesson 1 of course 1." />
              </strong>{" "}
              <T
                zh={
                  <>
                    不假设你会 npm。每节课读完，把页尾那几个练习做掉再走 ——
                    <strong>别攒着最后一起做</strong>，练习是用来固化刚读的东西的。
                  </>
                }
                en={
                  <>
                    It assumes no npm knowledge. Finish the exercises at the foot of each
                    lesson before moving on — <strong>do not save them up</strong>; they
                    exist to set what you just read.
                  </>
                }
              />
            </li>
            <li>
              <strong>
                <T zh="一门课走完，去刷八股。" en="Finish a course, then drill." />
              </strong>{" "}
              <T
                zh={
                  <>
                    <Link href="/drill">{DRILLS.length} 道问答</Link>用嘴答，答完自评
                    「会 / 模糊 / 不会」—— 自评结果直接决定
                    <Link href="/drill/session">抽认卡</Link>下一轮先抽谁。
                  </>
                }
                en={
                  <>
                    Answer the <Link href="/drill">{DRILLS.length} questions</Link> out
                    loud, then rate yourself. Those ratings drive what the{" "}
                    <Link href="/drill/session">flashcard rounds</Link> show you next.
                  </>
                }
              />
            </li>
            <li>
              <strong>
                <T zh="做几个课内练习之后，去写整块。" en="After some exercises, write whole blocks." />
              </strong>{" "}
              <T
                zh={
                  <>
                    <Link href="/code">{CODING.length} 道 coding 题</Link>，其中
                    <strong>{sandboxCount} 道能在浏览器里直接跑测试</strong> ——
                    点「打开工作区」，写完点「跑测试」，红变绿才算过。
                  </>
                }
                en={
                  <>
                    <Link href="/code">{CODING.length} coding problems</Link>,{" "}
                    <strong>{sandboxCount} of them runnable right in the browser</strong>{" "}
                    — open the workspace, write, run the tests, go from red to green.
                  </>
                }
              />
            </li>
            <li>
              <strong>
                <T zh="最后进考场。" en="Finally, the arena." />
              </strong>{" "}
              <T
                zh={
                  <>
                    <Link href="/arena">{ARENA.length} 道</Link>：空文件夹、计时、
                    没有提示按钮、答案锁到交卷。
                    <strong>这一档才是真实考试的样子</strong> ——
                    前三档跑绿了不代表空手能做出来。
                  </>
                }
                en={
                  <>
                    <Link href="/arena">{ARENA.length} challenges</Link>: empty folder,
                    a clock, no hint button, answers locked until you submit.{" "}
                    <strong>This tier is what the real thing looks like.</strong>
                  </>
                }
              />
            </li>
          </ol>
          <p className="guide-note">
            <T
              zh={
                <>
                  首页那四块会跟着你的进度变 —— 还没到时候的会写着「课程走完一门再来刷」，
                  到了就变成「可以开始了」。<strong>但四个入口一直都能点</strong>，
                  有基础的人第一天就想去考场，不该被挡。
                </>
              }
              en={
                <>
                  The four blocks on the home page follow your progress and tell you when
                  each tier is worth starting.{" "}
                  <strong>All four stay clickable regardless</strong> — if you already
                  know this material, go straight to the arena.
                </>
              }
            />
          </p>
        </section>

        {/* ---------------- 三、每天怎么用 ---------------- */}
        <section className="guide-sec">
          <h2 className="guide-h">
            <T zh="三、每天怎么用" en="3. Day to day" />
          </h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <T zh="你有多少时间" en="Time you have" />
                  </th>
                  <th>
                    <T zh="做什么" en="What to do" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <T zh="20 分钟（通勤、排队）" en="20 minutes (commute, queue)" />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          <Link href="/drill/session">抽认卡</Link>。只出问题，
                          心里答完再翻面。手机上就能刷。
                        </>
                      }
                      en={
                        <>
                          <Link href="/drill/session">Flashcards</Link>. Question only;
                          answer in your head, then flip. Works fine on a phone.
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T zh="60 分钟（一个完整的坐下）" en="60 minutes (one real sitting)" />
                  </td>
                  <td>
                    <T
                      zh="一节课读完 + 把它的练习做掉。这是主线推进最快的用法。"
                      en="One lesson plus its exercises. This is the fastest way to move the trunk forward."
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T zh="90 分钟以上" en="90 minutes or more" />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          一道 <Link href="/code">coding 题</Link>写到全绿，
                          或者一道<Link href="/arena">考场题</Link>。
                          考场题别切成两半做 —— 中断一次，计时就没意义了。
                        </>
                      }
                      en={
                        <>
                          One <Link href="/code">coding problem</Link> to all-green, or
                          one <Link href="/arena">arena challenge</Link>. Do not split an
                          arena run across sittings — the clock stops meaning anything.
                        </>
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="guide-note">
            <T
              zh={
                <>
                  <strong>进度存在这台机器的浏览器里</strong>（localStorage），
                  不需要登录，也不会同步到别的设备。换电脑要从头记。
                </>
              }
              en={
                <>
                  <strong>Progress lives in this browser</strong> (localStorage). No
                  account, and it does not sync across devices.
                </>
              }
            />
          </p>
        </section>

        {/* ---------------- 四、考前一周 ---------------- */}
        <section className="guide-sec">
          <h2 className="guide-h">
            <T zh="四、考前一周怎么冲" en="4. The week before an assessment" />
          </h2>
          <p>
            <T
              zh={
                <>
                  这一周<strong>不要再读新课文</strong>。新知识这时候进不去，
                  而且会挤掉你本来能拿到的分。按这个顺序：
                </>
              }
              en={
                <>
                  <strong>Stop reading new lessons this week.</strong> New material will
                  not stick now, and it crowds out points you could already have earned.
                  In this order:
                </>
              }
            />
          </p>
          <ol className="guide-steps">
            <li>
              <T
                zh={
                  <>
                    <strong>先做一道考场题</strong>，看看现在什么水平。做不出来很正常
                    —— 它就是用来暴露缺口的。
                  </>
                }
                en={
                  <>
                    <strong>Run one arena challenge first</strong> to see where you
                    actually stand. Failing it is normal — that is what it is for.
                  </>
                }
              />
            </li>
            <li>
              <T
                zh={
                  <>
                    <strong>缺口回填。</strong>卡在哪一步，就回去看那道题
                    「展开讲解」引用的那一节 —— 是同一份内容，不是另写的摘要。
                  </>
                }
                en={
                  <>
                    <strong>Patch the gaps.</strong> Wherever you got stuck, open that
                    problem&rsquo;s linked lesson — it is the same content, not a summary.
                  </>
                }
              />
            </li>
            <li>
              <T
                zh={
                  <>
                    <strong>抽认卡只抽「模糊 + 不会」。</strong>
                    <Link href="/drill/session">抽认卡</Link>的范围选择里有这一档，
                    考前一晚就抽这一堆。
                  </>
                }
                en={
                  <>
                    <strong>Flashcards, shaky and unknown only.</strong> That scope
                    exists in <Link href="/drill/session">the flashcard setup</Link> —
                    it is the stack for the night before.
                  </>
                }
              />
            </li>
            <li>
              <T
                zh={
                  <>
                    <strong>最后一天再做一遍同一道考场题。</strong>
                    第二遍才是你真实的水平 —— 第一遍超时很正常。
                  </>
                }
                en={
                  <>
                    <strong>Redo the same arena challenge on the last day.</strong> The
                    second pass is your real level; overrunning the clock on the first is
                    normal.
                  </>
                }
              />
            </li>
          </ol>
        </section>

        {/* ---------------- 五、几条要知道的边界 ---------------- */}
        <section className="guide-sec">
          <h2 className="guide-h">
            <T zh="五、几条边界，先说清楚" en="5. A few limits, stated up front" />
          </h2>
          <ul className="guide-limits">
            <li>
              <T
                zh={
                  <>
                    <strong>练习的「检查」不是跑代码</strong> ——
                    它是正则匹配（去掉注释后再匹配），能判「你有没有用 filter 而不是 push」，
                    判不了「你写的到底跑不跑得通」。
                    <strong>真跑测试的只有 <Link href="/code">/code</Link> 里那 {sandboxCount} 道。</strong>
                  </>
                }
                en={
                  <>
                    <strong>The check on exercises does not run your code.</strong> It is
                    a regex match, so it can tell whether you used filter instead of push,
                    not whether your code works.{" "}
                    <strong>
                      Only the {sandboxCount} sandboxed problems in{" "}
                      <Link href="/code">/code</Link> really run tests.
                    </strong>
                  </>
                }
              />
            </li>
            <li>
              <T
                zh={
                  <>
                    <strong>考场和模拟考故意不给运行环境。</strong>
                    不是做不到 —— 是给了就把最高那一档删掉了。自己搭环境本身就是考点，
                    所以那两个页面把命令、文件树、该看到什么输出都写死了。
                  </>
                }
                en={
                  <>
                    <strong>The arena and mock exams deliberately have no runner.</strong>{" "}
                    Not a limitation — setting up your own environment is part of what is
                    being tested, so those pages spell out every command and expected
                    output instead.
                  </>
                }
              />
            </li>
            <li>
              <T
                zh={
                  <>
                    <strong>沙箱需要联网</strong>（打包器在 CodeSandbox 的远程服务上）。
                    断网时页面会退回「本机跑」卡片，命令照样给全。
                  </>
                }
                en={
                  <>
                    <strong>The sandboxes need a network connection</strong> (the bundler
                    is remote). Offline, the page falls back to run-it-locally cards with
                    the full commands.
                  </>
                }
              />
            </li>
            <li>
              <T
                zh={
                  <>
                    <strong>界面是双语的，内容大部分只有中文。</strong>
                    {totalExercises} 个练习的题面和提示、讲解段的标题都还是中文；
                    英文完整的是八股答案（面试官念的是英文）和每段讲解的正文。
                  </>
                }
                en={
                  <>
                    <strong>The interface is bilingual; most content is not.</strong> All{" "}
                    {totalExercises} exercise prompts and the section headings are Chinese
                    only. Fully in English: the drill answers and every explanation body.
                  </>
                }
              />
            </li>
          </ul>
        </section>

        <p className="guide-cta">
          <Link className="btn btn-primary" href="/path">
            <T zh="去挑一门课开始 →" en="Pick a course and start →" />
          </Link>
        </p>
      </div>
    </main>
  );
}
