import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateNoteText } from "./ValidateNote";

const v5OrgPath = "/tmp/20260823T010203--理解-目标函数__is.org";
const v5MdPath = "/tmp/20260823T010203--理解-目标函数__is.md";
const DEFINITION = "目标函数是在一组可选方案上给出可比较结果、供优化过程判断哪个方案更符合目标的函数或规则。";
const OPERATION = "它把每个候选方案映射成一个值，求解过程据此保留更优方案，直到不能继续改进或达到停止条件。";
const RECOGNITION = "优化不是先有方向再做计算，目标函数本身就在规定什么变化会被系统当成进步。";
const GUIDANCE = "设计或评估优化系统时，先看目标函数奖励什么、漏掉什么，再检查高分是否真的对应想要的结果。";
const orgPath = "/tmp/20260823T010203--动词-网约车秩序__is.org";
const mdPath = "/tmp/20260823T010203--动词-网约车秩序__is.md";
const ACTION = "平台经营者借助手机定位和实时派单，把原本彼此看不见的乘客与司机组织成一张由平台居中调度的城市出行网络。";

function goodV5Org(): string {
  return `#+title: 理解：目标函数
#+date: [2026-08-23 Sun 01:02]
#+identifier: 20260823T010203
#+filetags: :is:act:
#+schema: ljg-is-v5
#+definition: ${DEFINITION}
#+operation: ${OPERATION}
#+recognition: ${RECOGNITION}
#+guidance: ${GUIDANCE}
#+basis: 在优化问题中，目标函数为候选方案赋值，求解过程按这些值比较和选择方案。
#+falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。

* 机器并不知道什么叫更好

看到「寻找最优解」，很容易以为机器已经知道什么叫好，只差把答案算出来。其实在计算开始以前，人必须先给出一把尺子。没有这把尺子，程序只能看见许多可能，不能判断该往哪边走。

${DEFINITION} 在路线规划里，方案可以是不同走法，目标函数可以比较它们各自需要的时间。它不是全部现实，只是把当前任务认定的重要差别变得可以比较。

* 一把尺子怎样推动搜索

${OPERATION} 目标函数告诉程序往哪里改进，约束条件则先排除那些不能采用的方案。两者经常一起出现，却在做不同的事。

这也改变了我们对「客观优化」的理解。优化不会消除人的判断，而是把一部分判断提前写进计算。分数越来越好，只能证明系统更符合这把尺子，不能单独证明现实也在变好。

* 先检查尺子，再相信高分

所以，看到一个系统声称自己在优化时，先别急着看它用了多复杂的算法。先问它究竟给什么加分，哪些重要结果没有进入计算。若高分方案在现实中反复造成目标之外的损失，问题可能不在求解器，而在那把尺子。

${GUIDANCE} 以后再看到「最优」两个字，可以把它自动补全成一句更准确的话：这是在当前目标函数和约束条件下得到的最优，而不是脱离条件的最好。
`;
}

function goodV5Markdown(): string {
  return goodV5Org()
    .replace(
      /^#\+title: (.+)\n#\+date: \[(.+)\]\n#\+identifier: (.+)\n#\+filetags: :is:act:\n#\+schema: (.+)\n#\+definition: (.+)\n#\+operation: (.+)\n#\+recognition: (.+)\n#\+guidance: (.+)\n#\+basis: (.+)\n#\+falsifier: (.+)/mu,
      "---\ntitle: $1\ndate: $2\nidentifier: $3\ntags: [is, act]\nschema: $4\ndefinition: $5\noperation: $6\nrecognition: $7\nguidance: $8\nbasis: $9\nfalsifier: $10\n---",
    )
    .replace(/^\* /gmu, "# ");
}

function goodV4Org(): string {
  return `#+title: 动词：网约车
#+date: [2026-08-23 Sun 01:02]
#+identifier: 20260823T010203
#+filetags: :is:act:
#+schema: ljg-is-v4
#+action: ${ACTION}
#+basis: 网约车依靠线上请求、位置匹配和平台派单组织乘客与司机，行程双方都要通过平台规则才能完成。
#+falsifier: 如果拿掉平台对入口和派单的安排，服务仍能按原样运行，那么当前解释就需要重写。

* 你叫来的不只是一辆车

晚上十点，你站在路边，附近没有空车。打开手机后，屏幕先告诉你要等多久，几分钟后一位陌生司机按照导航来接你。一次原本靠碰运气发生的相遇，现在像按下开关一样出现了。

${ACTION} 改变不只在于叫车更快。谁先遇见谁、这次相遇怎样开始，都有了一个居中的安排者。

* 平台开始替陌生人安排相遇

事情原本也可以走另一条路。城市可以建设公共叫车系统，司机也可以用合作社共同管理入口，让乘客和司机一起决定关键规则。商业平台之所以迅速长大，是因为它先解决了双方互相找不到的麻烦，但方便本身还不能说明规则理应归平台所有。

平台一旦成为入口，就不只是介绍双方认识。它决定哪些司机先看到订单，也用计价和评价影响一次服务怎样完成。司机获得了客源，却要学习平台看重什么；乘客少等了车，也开始把位置和选择交给系统。

当司机和乘客逐渐依赖这套安排，它便反过来改变他们。司机会围绕派单和评分调整工作，乘客会按照平台给出的时间与价格作决定，平台也必须维持足够的车辆和可信的处置能力。它承诺的方便，后来成了它自己不能随意撤回的责任。

* 方便以后，规则归谁

往回看，关键一步不是汽车开始载客，而是平台把陌生人的临时需要变成可以持续计算的相遇。从这一步开始，「谁来安排相遇，又由谁承担失误」就成了反复出现的问题。未来可以有公共平台、合作社或更开放的接口，但每条路都要重新回答这个问题。

这一步打开了随时叫车的生活，也让城市越来越依赖一个数字入口。规则若能被司机和乘客共同修改，方便或许不必以交出全部决定权为代价。若入口继续集中，选择看上去很多，决定规则的人却可能很少。

这里说的是网约车的一般运行方式，不是在断言每个平台都使用同样的规则。如果拿掉平台对入口和派单的安排，乘客与司机仍能按原样完成这种即时服务，那么这篇解释就站不住。当一项方便已经成了城市日常，到底谁有权修改维持它的规则？
`;
}

function goodV4Markdown(): string {
  return goodV4Org()
    .replace(
      /^#\+title: (.+)\n#\+date: \[(.+)\]\n#\+identifier: (.+)\n#\+filetags: :is:act:\n#\+schema: (.+)\n#\+action: (.+)\n#\+basis: (.+)\n#\+falsifier: (.+)/mu,
      "---\ntitle: $1\ndate: $2\nidentifier: $3\ntags: [is, act]\nschema: $4\naction: $5\nbasis: $6\nfalsifier: $7\n---",
    )
    .replace(/^\* /gmu, "# ");
}

function goodV3Org(): string {
  return `#+title: 动词：绩效考核
#+date: [2026-08-23 Sun 01:02]
#+identifier: 20260823T010203
#+filetags: :is:act:
#+schema: ljg-is-v3

* 动词判断
- *原问*：绩效考核是什么？
- *改问*：组织管理者凭什么把工作价值做成可量化奖惩的秩序，而不是保留多方叙述与协商？
- *作*：组织管理者以量化评分，把分散工作的价值判断做成可比较、可奖惩的管理秩序。

* 一个不
- *给定*：工作贡献主要由具体协作中的判断和信任确认。
- *不*：贡献不必只留在具体关系中，也可以被统一尺度组织。
- *未选*：由同事、客户与本人共同叙述贡献，再公开协商奖惩。

* 理由
- *已有*：统一评分降低跨团队比较成本，并给奖惩提供记录。
- *尚缺*：可比较不等于公正，指标不能代表全部工作。

* 做成的秩序
- *规则*：指标、权重和周期决定哪些贡献进入正式判断。
- *关系*：管理者成为评分者，员工成为被比较者。
- *分配*：奖金、机会和风险按评分重新分配。

* 卷入与反制
- *卷入*：员工、经理、协作者和组织共同承担后果。
- *回应*：员工可以解释、争议或拒绝评价。
- *反制*：评分体系一旦成为人事依据，管理者也必须服从指标，难以承认体系没有记录的贡献。

* 历史与未来
- *本源*：从指标异化的困境逆溯，分析追到组织用统一尺度比较岗位的创建事件；它使「不同工作凭什么可比」持续成为不能删除的问题。
- *打开*：组织可以跨团队比较工作。
- *关闭*：难量化的工作更难进入判断。
- *修正*：组织可以开放指标制定和申诉。

* 未决问题
- *凭什么*：凭什么让统一评分取得决定奖惩的权力，而不是保留协商？
- *接下来*：评分会把员工和管理者共同做成怎样的人？

* 根据与边界
- *根据*：评分连接跨人比较、奖金和晋升，是本分析采用的制度事实。
- *推断*：参与者会把行动转向可记录指标。
- *边界*：本分析不证明所有评分必然不公。
- *反驳*：如果评分不影响任何资源或行动，当前判断就需要重写。
`;
}

function legacyV2(): string {
  return `#+title: 本质：Taxi
#+date: [2026-08-01 Sat 01:02]
#+identifier: 20260801T010203
#+filetags: :is:
#+schema: ljg-is-v2

* 问题
真正问题：乘客最终从哪里到哪里？

* 完整表达
完整：（面向乘客）把人从 A 点送到 B 点

* 剥离
- *实现*：汽车可以替换

* 本质
核心：把人从 A 点送到 B 点

* 示例
- *代入*：你从公司回家

* 结构迁移
- *结构式*：(X, S0) -> (X, S1)
- *变量*：X=对象
- *迁移*：文件 A -> B
- *边界*：只迁移位置；不迁移身份

* 验证
- *替换*：换车仍成立
`;
}

function errorsFor(content: string, path = orgPath): string[] {
  return validateNoteText(path, content).errors;
}

function v5ErrorsFor(content: string, path = v5OrgPath): string[] {
  return validateNoteText(path, content).errors;
}

describe("ValidateNote v5 usable-understanding contract", () => {
  test("template combines definition, operation, recognition and guidance", async () => {
    const template = await Bun.file(new URL("../Template.md", import.meta.url)).text();
    expect(template).toMatch(/^(?:#\+schema:|schema:) ljg-is-v5$/m);
    for (const key of [
      "definition",
      "operation",
      "recognition",
      "guidance",
      "basis",
      "falsifier",
    ]) {
      expect(template).toMatch(new RegExp(`^(?:#\\+${key}:|${key}:)`, "m"));
    }
    expect(template).not.toMatch(/^(?:\*|#) (?:是什么|如何运作|认知改变|行动指导)$/mu);
  });

  test("accepts a complete v5 Org note that ends with a usable judgment", () => {
    const result = validateNoteText(v5OrgPath, goodV5Org());
    expect(result.ok).toBe(true);
    expect(result.schema).toBe("ljg-is-v5");
    expect(result.definition).toBe(DEFINITION);
    expect(result.operation).toBe(OPERATION);
    expect(result.review_required).toBe(true);
    expect(result.review_status).toBe("review_required");
    expect(result.warnings.join("\n")).toContain("不是理解通过");
    expect(result.errors).toEqual([]);
  });

  test("accepts a complete v5 Markdown note", () => {
    expect(validateNoteText(v5MdPath, goodV5Markdown()).ok).toBe(true);
  });

  test("rejects a blank or too-short operation without treating that as a semantic keyword failure", () => {
    const blank = goodV5Org().replace(/^#\+operation:.*\n/mu, "");
    const short = goodV5Org().replace(`#+operation: ${OPERATION}`, "#+operation: 只写半句。");
    expect(v5ErrorsFor(blank).some((error) => error.includes("operation"))).toBe(true);
    expect(validateNoteText(v5OrgPath, blank).ok).toBe(false);
    expect(validateNoteText(v5OrgPath, blank).review_status).toBe("structural_fail");
    expect(v5ErrorsFor(short).some((error) => error.includes("长度"))).toBe(true);
    expect(validateNoteText(v5OrgPath, short).ok).toBe(false);
  });

  test("requires definition, operation, recognition and guidance", () => {
    for (const key of ["definition", "operation", "recognition", "guidance"]) {
      const note = goodV5Org().replace(new RegExp(`^#\\+${key}: .+\\n`, "mu"), "");
      expect(v5ErrorsFor(note).some((error) => error.includes(key))).toBe(true);
    }
  });

  test("rejects vague guidance but does not require an open question", () => {
    const vague = goodV5Org().replace(`#+guidance: ${GUIDANCE}`, "#+guidance: 今后对此保持关注，具体情况具体分析。");
    expect(v5ErrorsFor(vague).some((error) => error.includes("guidance"))).toBe(true);
    expect(goodV5Org().trimEnd().endsWith("。")).toBe(true);
    expect(validateNoteText(v5OrgPath, goodV5Org()).ok).toBe(true);
  });

  test("rejects checklist headings and visible field labels", () => {
    const heading = goodV5Org().replace("* 机器并不知道什么叫更好", "* 是什么");
    const label = goodV5Org().replace("看到「寻找最优解」", "定义：目标函数是一把尺子。\n\n看到「寻找最优解」");
    expect(v5ErrorsFor(heading).some((error) => error.includes("标题"))).toBe(true);
    expect(v5ErrorsFor(label).some((error) => error.includes("字段标签"))).toBe(true);
  });

  test("accepts natural operation, recognition, and falsifier wording in Org and Markdown", () => {
    const operation = "缓存先收下请求，再按键查找已有结果；命中时直接交回已存内容，未命中才回到源头读取。";
    const recognition = "人们原先把缓存看成总会更新的副本，读过读写路径以后会改成：它只在命中时省掉一次取数。";
    const falsifier = "假如缓存命中时仍然每次都回到源头读取整份数据，这套解释就失效了。";
    const org = goodV5Org()
      .replace(`#+operation: ${OPERATION}`, `#+operation: ${operation}`)
      .replace(`#+recognition: ${RECOGNITION}`, `#+recognition: ${recognition}`)
      .replace("#+falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。", `#+falsifier: ${falsifier}`);
    const markdown = goodV5Markdown()
      .replace(`operation: ${OPERATION}`, `operation: ${operation}`)
      .replace(`recognition: ${RECOGNITION}`, `recognition: ${recognition}`)
      .replace("falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。", `falsifier: ${falsifier}`);
    expect(validateNoteText(v5OrgPath, org).ok).toBe(true);
    expect(validateNoteText(v5MdPath, markdown).ok).toBe(true);
    const reversed = goodV5Org().replace(
      "#+falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。",
      "#+falsifier: 当前解释就得改写，假如命中时仍要回源读取整份数据。",
    );
    expect(validateNoteText(v5OrgPath, reversed).ok).toBe(true);
    const contrastiveExplanation = goodV5Org().replace(
      `#+recognition: ${RECOGNITION}`,
      "#+recognition: 这说明人们原先把缓存看成总会更新的副本，读过路径以后会改成只在命中时省掉取数。",
    );
    expect(validateNoteText(v5OrgPath, contrastiveExplanation).ok).toBe(true);
  });

  test("warns on purpose-only, abstract, and negated wording instead of rejecting it", () => {
    const purpose = goodV5Org().replace(`#+operation: ${OPERATION}`, "#+operation: 它的用途是帮助人们提高效率并改善日常体验。");
    const slogan = goodV5Org().replace(`#+operation: ${OPERATION}`, "#+operation: 它通过提高效率来发挥作用，用途是帮助人们改善体验。");
    const abstract = goodV5Org().replace(`#+recognition: ${RECOGNITION}`, "#+recognition: 这个概念很深刻，让人感到启发，值得反复体会。");
    const bareActually = goodV5Org().replace(`#+recognition: ${RECOGNITION}`, "#+recognition: 其实这个概念给人一种深刻的启发，值得继续体会其中的意味。");
    const noCondition = goodV5Org().replace(
      "#+falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。",
      "#+falsifier: 当前解释以后可能需要重写，不过现在还没有具体事实。",
    );
    const noOverturn = goodV5Org().replace(
      "#+falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。",
      "#+falsifier: 如果大家以后更加努力，整体结果就会变得更好。",
    );
    const several = goodV5Org().replace(
      "#+falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。",
      "#+falsifier: 若干人不同意这个说法，所以当前解释需要重写。",
    );
    const arrangePurpose = goodV5Org().replace(
      `#+operation: ${OPERATION}`,
      "#+operation: 它的用途是帮助人们整理日常资料、提高效率并改善体验。",
    );
    const explainsAbstract = goodV5Org().replace(
      `#+recognition: ${RECOGNITION}`,
      "#+recognition: 这说明这个概念非常深刻，给人很大启发，值得反复体会。",
    );
    const negatedFalsifier = goodV5Org().replace(
      "#+falsifier: 如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。",
      "#+falsifier: 假如缓存命中仍需回源，当前解释依然成立，不需要改写。",
    );
    for (const note of [purpose, slogan, arrangePurpose, abstract, bareActually, explainsAbstract, noCondition, noOverturn, several, negatedFalsifier]) {
      const result = validateNoteText(v5OrgPath, note);
      expect(result.ok, note).toBe(true);
      expect(result.review_required, note).toBe(true);
      expect(result.review_status, note).toBe("review_required");
      expect(result.warnings.join("\n"), note).toContain("需复核");
      expect(result.errors.join("\n"), note).not.toMatch(/operation|recognition|falsifier/);
    }
  });

  test("judges mechanism, judgment contrast, and affirmative falsification by clause shape", () => {
    const withField = (key: string, value: string) => goodV5Org().replace(new RegExp(`^#\\+${key}:.*$`, "mu"), `#+${key}: ${value}`);
    const operationCases: Array<[string, boolean]> = [
      ["缓存先按键查找已有结果，命中时直接返回，未命中才回源读取，从而提高效率。", true],
      ["缓存先收下请求，再按键查找已有结果；命中时直接交回已存内容，未命中才回到源头读取。", true],
      ["缓存先按键查找已有结果，命中时直接返回；它的用途是提高效率。", true],
      ["它把重复读取映射成一次命中，未命中才回源，从而提高效率并改善体验。", true],
      ["它的用途是帮助人们整理日常资料、提高效率并改善体验。", false],
      ["它的用途是帮助人们提高效率并改善日常体验。", false],
      ["它通过提高效率来发挥作用，用途是帮助人们改善体验。", false],
      ["它用来帮助人们整理日常资料，从而提高效率。", false],
      ["缓存用来减少回源开销，先根据键查找已有结果，命中时直接返回，未命中才读取源数据。", true],
      ["缓存用来把请求映射成键并返回已存结果，以避免每次重复读取源数据。", true],
      ["有助于减少回源，先查找已有结果，命中时返回，未命中才读取。", true],
      ["它用来提高效率，并改善人们的日常体验。", false],
    ];
    for (const [value] of operationCases) {
      const result = validateNoteText(v5OrgPath, withField("operation", value));
      expect(result.ok, value).toBe(true);
      expect(result.review_status, value).toBe("review_required");
      expect(result.errors.join("\n"), value).not.toContain("operation");
    }

    const recognitionCases: Array<[string, boolean]> = [
      ["优化不是先有方向再做计算，目标函数本身就在规定什么变化会被系统当成进步。", true],
      ["人们原先把缓存看成总会更新的副本，读过读写路径以后会改成：它只在命中时省掉一次取数。", true],
      ["这说明人们原先把缓存看成总会更新的副本，之后会改成只在命中时省事。", true],
      ["优化不是先有方向再做计算，而是先有一把可比较的尺子。", true],
      ["人们不再把命中当成源头已经更新的证据。", true],
      ["这个概念不只非常深刻，而且很有启发，值得大家反复体会其中的意味。", false],
      ["这说明这个概念非常深刻，给人很大启发，值得反复体会。", false],
      ["这个概念很深刻，让人感到启发，值得反复体会。", false],
      ["其实这个概念给人一种深刻的启发，值得继续体会其中的意味。", false],
      ["这个概念不只是非常深刻，而且很有启发，值得反复体会。", false],
      ["理解缓存后，判断依据应当从副本是否存在转向命中时是否仍需回源。", true],
      ["判断应当从看副本是否存在转向看命中后是否回源。", true],
      ["判断缓存不能只看副本是否存在，还要看命中后是否回源。", true],
      ["判断缓存不能再仅看副本是否存在，而要核对命中后是否回源。", true],
      ["应当从更深刻的角度体会这个概念，它值得反复体会其中的意味。", false],
      ["这个概念不能只停留在一句深刻的体会里，它值得大家反复体会。", false],
    ];
    for (const [value] of recognitionCases) {
      const result = validateNoteText(v5OrgPath, withField("recognition", value));
      expect(result.ok, value).toBe(true);
      expect(result.warnings.length, value).toBeGreaterThan(0);
      expect(result.errors.join("\n"), value).not.toContain("recognition");
    }

    const falsifierCases: Array<[string, boolean]> = [
      ["假如缓存命中时仍然每次都回到源头读取整份数据，这套解释就失效了。", true],
      ["如果候选方案的目标函数值与求解过程的比较和选择完全无关，那么当前解释需要重写。", true],
      ["若比较所用的值和实际选择无关，那么当前解释就不成立。", true],
      ["当前解释就得改写，假如命中时仍要回源读取整份数据。", true],
      ["假如命中仍要回源，当前解释因此失效。", true],
      ["假如命中仍要回源，当前解释不得不改写。", true],
      ["假如缓存命中仍需回源，当前解释不会因此失效。", false],
      ["假如缓存命中仍需回源，当前解释不会因此就失效。", false],
      ["假如缓存命中仍需回源，当前解释依然成立，不需要改写。", false],
      ["假如缓存命中仍需回源，当前解释并不会失效。", false],
      ["假如缓存命中仍需回源，当前解释并不因此推翻。", false],
      ["如果大家以后更加努力，整体结果就会变得更好。", false],
      ["当前解释以后可能需要重写，不过现在还没有具体事实。", false],
      ["若干人不同意这个说法，所以当前解释需要重写。", false],
    ];
    for (const [value] of falsifierCases) {
      const result = validateNoteText(v5OrgPath, withField("falsifier", value));
      expect(result.ok, value).toBe(true);
      expect(result.warnings.join("\n"), value).toContain("falsifier");
      expect(result.errors.join("\n"), value).not.toContain("falsifier");
    }

    const v4Negated = [
      "假如缓存命中仍需回源，当前解释不会因此失效。",
      "假如缓存命中仍需回源，当前解释依然成立，不需要改写。",
      "假如缓存命中仍需回源，当前解释并不因此推翻。",
    ];
    for (const value of v4Negated) {
      const result = validateNoteText(orgPath, goodV4Org().replace(/^#\+falsifier:.*$/mu, `#+falsifier: ${value}`));
      expect(result.ok, value).toBe(true);
      expect(result.review_required, value).toBe(true);
      expect(result.errors.join("\n"), value).not.toContain("falsifier");
    }
    const v4Affirmative = goodV4Org().replace(
      /^#\+falsifier:.*$/mu,
      "#+falsifier: 假如命中仍要回源，当前解释因此失效。",
    );
    expect(validateNoteText(orgPath, v4Affirmative).ok).toBe(true);
  });

  test("keeps base-accepted mechanisms and explicit transitions, and records the semantic narrowing", () => {
    const withField = (key: string, value: string) => goodV5Org().replace(new RegExp(`^#\\+${key}:.*$`, "mu"), `#+${key}: ${value}`);
    const baseOperation = /(?:输入|输出|映射|比较|选择|计算|组织|连接|限制|决定|调整|保留|排除|生成|改变|作用|把|将|让|使|通过|根据|按照)/u;
    const baseRecognition = /(?:不是|不再|原来|以为|意味着|这使|改变|不能只|不能再|应当从|关键不在|关键在|真正)/u;
    const retainedOperation = [
      "它把每个候选方案映射成一个值，求解过程据此保留更优方案，直到不能继续改进或达到停止条件。",
      "缓存用来减少回源开销，先根据键查找已有结果，命中时直接返回，未命中才读取源数据。",
      "它通过比较保留更优方案，直到不能继续改进或停止。",
      "求解过程根据目标值选择方案，并保留不能继续改进之前的结果。",
    ];
    for (const value of retainedOperation) {
      expect(baseOperation.test(value), value).toBe(true);
      expect([...value].length, value).toBeGreaterThanOrEqual(18);
      expect(validateNoteText(v5OrgPath, withField("operation", value)).ok, value).toBe(true);
    }
    const retainedRecognition = [
      "优化不是先有方向再做计算，目标函数本身就在规定什么变化会被系统当成进步。",
      "理解缓存后，判断依据应当从副本是否存在转向命中时是否仍需回源。",
      "判断应当从看副本是否存在转向看命中后是否回源。",
      "人们不再把命中当成源头已经更新的证据。",
    ];
    for (const value of retainedRecognition) {
      expect(baseRecognition.test(value), value).toBe(true);
      expect([...value].length, value).toBeGreaterThanOrEqual(18);
      expect(validateNoteText(v5OrgPath, withField("recognition", value)).ok, value).toBe(true);
    }
    const narrowed: Array<[string, string]> = [
      ["operation", "它的用途是通过提高效率来改善人们的日常体验。"],
      ["recognition", "应当从更深刻的角度体会这个概念，它值得反复体会其中的意味。"],
      ["recognition", "这意味着缓存很有启发，值得反复体会其中的意味。"],
      ["recognition", "这个概念真正非常深刻，值得大家反复体会其中的意味。"],
    ];
    for (const [key, value] of narrowed) {
      const base = key === "operation" ? baseOperation : baseRecognition;
      expect(base.test(value), value).toBe(true);
      const result = validateNoteText(v5OrgPath, withField(key, value));
      expect(result.ok, value).toBe(true);
      expect(result.review_status, value).toBe("review_required");
      expect(result.errors.join("\n"), value).not.toContain(key);
    }

    const recognitionAudit: Array<[string, string, string]> = [
      ["不是", "优化不是只看副本是否存在，而是看命中后是否回源。", "这个概念很深刻，值得反复体会其中的意味。"],
      ["不再", "人们不再把命中当成源头已经更新的证据。", "这个概念很深刻，值得反复体会其中的意味。"],
      ["原来", "原来以为副本是否存在就够了，现在改成要看命中后是否回源。", "原来这个概念非常深刻，值得反复体会其中的意味。"],
      ["以为", "人们以为只看副本是否存在，而不是看命中后是否回源。", "我以为这个概念非常深刻，值得反复体会其中的意味。"],
      ["意味着", "这意味着判断不能只看副本是否存在，还要看命中后是否回源。", "这意味着缓存很有启发，值得反复体会其中的意味。"],
      ["这使", "这使判断从看副本是否存在转向看命中后是否回源。", "这使这个概念更加深刻，值得反复体会其中的意味。"],
      ["改变", "判断依据从副本是否存在改变为命中后是否仍需回源。", "这改变了感受，这个概念非常深刻，值得反复体会。"],
      ["不能只", "判断缓存不能只看副本是否存在，还要看命中后是否回源。", "这个概念不能只停留在一句深刻的体会里，它值得大家反复体会。"],
      ["不能再", "不能再把副本是否存在当成充分判断，而要看命中后是否回源。", "这个概念不能再被低估，它非常深刻，值得反复体会。"],
      ["应当从", "判断依据应当从副本是否存在转向命中时是否仍需回源。", "应当从更深刻的角度体会这个概念，它值得反复体会其中的意味。"],
      ["关键不在", "关键不在副本是否存在，而在命中后是否仍需回源。", "关键不在表面感受，这个概念非常深刻，值得反复体会。"],
      ["关键在", "关键在命中后是否回源，而不是副本是否存在。", "关键在于这个概念非常深刻，值得大家反复体会其中的意味。"],
      ["真正", "真正要改的判断不是副本是否存在，而是命中后是否回源。", "这个概念真正非常深刻，值得大家反复体会其中的意味。"],
    ];
    for (const [marker, contrast, praise] of recognitionAudit) {
      expect(baseRecognition.test(contrast), marker).toBe(true);
      expect(contrast.includes(marker), marker).toBe(true);
      expect([...contrast].length, contrast).toBeGreaterThanOrEqual(18);
      expect(validateNoteText(v5OrgPath, withField("recognition", contrast)).ok, contrast).toBe(true);
      expect(praise.includes(marker) || marker === "不是" || marker === "不再", marker).toBe(true);
      expect([...praise].length, praise).toBeGreaterThanOrEqual(18);
      const praiseResult = validateNoteText(v5OrgPath, withField("recognition", praise));
      expect(praiseResult.ok, praise).toBe(true);
      expect(praiseResult.review_required, praise).toBe(true);
      expect(praiseResult.errors.join("\n"), praise).not.toContain("recognition");
    }
    const markdownContrast = goodV5Markdown().replace(
      `recognition: ${RECOGNITION}`,
      "recognition: 判断缓存不能只看副本是否存在，还要看命中后是否回源。",
    );
    expect(validateNoteText(v5MdPath, markdownContrast).ok).toBe(true);
  });

  test("does not require a protagonist, forced back-action or question ending", () => {
    const result = validateNoteText(v5OrgPath, goodV5Org());
    expect(result.ok).toBe(true);
    expect(goodV5Org()).not.toContain("反过来规定创造者");
    expect(goodV5Org().trimEnd()).not.toEndWith("？");
  });
});

describe("ValidateNote v4 narrative contract", () => {
  test("accepts a structurally valid v4 Org note", () => {
    const result = validateNoteText(orgPath, goodV4Org());
    expect(result.ok).toBe(true);
    expect(result.schema).toBe("ljg-is-v4");
    expect(result.action).toBe(ACTION);
  });

  test("accepts a structurally valid v4 Markdown note", () => {
    expect(validateNoteText(mdPath, goodV4Markdown()).ok).toBe(true);
  });

  test("keeps v3 notes readable", () => {
    const result = validateNoteText("/tmp/20260823T010203--动词-绩效考核__is.org", goodV3Org());
    expect(result.ok).toBe(true);
    expect(result.schema).toBe("ljg-is-v3");
  });

  test("keeps v2 notes readable", () => {
    const result = validateNoteText("/tmp/20260801T010203--本质-taxi__is.org", legacyV2());
    expect(result.ok).toBe(true);
    expect(result.core).toBe("把人从 A 点送到 B 点");
  });

  test("rejects an unknown schema", () => {
    expect(errorsFor(goodV4Org().replace("ljg-is-v4", "ljg-is-v99")).some((error) => error.includes("schema"))).toBe(true);
  });

  test("requires the v4 filename", () => {
    expect(errorsFor(goodV4Org(), "/tmp/网约车.org").some((error) => error.includes("v4 文件名"))).toBe(true);
  });

  test("requires action title and tags", () => {
    const badTitle = goodV4Org().replace("动词：网约车", "本质：网约车");
    const badTags = goodV4Org().replace(":is:act:", ":is:");
    expect(errorsFor(badTitle).some((error) => error.includes("title"))).toBe(true);
    expect(errorsFor(badTags).some((error) => error.includes("act"))).toBe(true);
  });

  test("allows two to four content-led headings but rejects rigid placeholders", () => {
    const two = goodV4Org().replace("\n* 平台开始替陌生人安排相遇\n", "\n");
    const tooMany = goodV4Org().replace("* 方便以后，规则归谁", "* 多出的一栏\n\n这是一段额外说明。\n\n这又是一段额外说明。\n\n* 又多出一栏\n\n这是一段额外说明。\n\n这又是一段额外说明。\n\n* 方便以后，规则归谁");
    const generic = goodV4Org().replace("* 你叫来的不只是一辆车", "* 开场");
    expect(validateNoteText(orgPath, two).ok).toBe(true);
    expect(errorsFor(tooMany).some((error) => error.includes("两到四个"))).toBe(true);
    expect(errorsFor(generic).some((error) => error.includes("标题必须具体"))).toBe(true);
  });

  test("rejects visible lists and framework fields", () => {
    const list = goodV4Org().replace("晚上十点", "- 规则：平台负责派单\n\n晚上十点");
    const label = goodV4Org().replace("事情原本也可以", "规则：平台负责派单。\n\n事情原本也可以");
    expect(errorsFor(list).some((error) => error.includes("项目符号"))).toBe(true);
    expect(errorsFor(label).some((error) => error.includes("字段标签"))).toBe(true);
  });

  test("requires enough paragraphs for a flowing explanation", () => {
    const note = goodV4Org().replace("\n\n平台一旦成为入口", " 平台一旦成为入口").replace("\n\n当司机和乘客", " 当司机和乘客");
    expect(errorsFor(note).some((error) => error.includes("每节至少"))).toBe(true);
  });

  test("requires a concrete opening", () => {
    const note = goodV4Org().replace(
      "晚上十点，你站在路边，附近没有空车。打开手机后，屏幕先告诉你要等多久，几分钟后一位陌生司机按照导航来接你。一次原本靠碰运气发生的相遇，现在像按下开关一样出现了。",
      "现代性塑造了一种新的流动范式。抽象关系由此进入复杂系统。主体间性也发生了结构变化。",
    );
    expect(errorsFor(note).some((error) => error.includes("具体的人"))).toBe(true);
  });

  test("allows a natural prose paraphrase while keeping action meaningful", () => {
    const paraphrased = goodV4Org().replace(
      `${ACTION} 改变不只在于叫车更快。谁先遇见谁、这次相遇怎样开始，都有了一个居中的安排者。`,
      "平台先看见你和司机各在哪里，再替你们配对。叫车变快只是表面变化，更深的变化是陌生人的相遇从此要经过同一个入口。",
    );
    const abstract = goodV4Org().replace(`#+action: ${ACTION}`, "#+action: 这是一段长度足够却没有关键动作和共同变化的抽象判断。社会因此出现了某种新影响。");
    expect(validateNoteText(orgPath, paraphrased).ok).toBe(true);
    expect(errorsFor(abstract).some((error) => error.includes("普通话"))).toBe(true);
  });

  test("keeps the Zhao lens conditional instead of forcing a plot", async () => {
    const workflow = await Bun.file(new URL("../Workflows/TraceCreation.md", import.meta.url)).text();
    expect(workflow).toContain("赵汀阳的问题链只作条件性补充");
    expect(workflow).toContain("不为了哲学完整而写进文章");
    expect(workflow).toContain("不强制虚构主人公");
    expect(workflow).toContain("若转折没有被前面的定义与机制逼出来，就删除");
  });

  test("rejects list punctuation and overlong sentences", () => {
    const listed = goodV4Org().replace("它决定哪些司机先看到订单", `平台考虑甲、乙、丙、丁、戊、己、庚、辛、壬、癸、子、丑、寅、卯、辰。它决定哪些司机先看到订单`);
    const long = goodV4Org().replace("改变不只在于叫车更快。", `${"这个变化不断叠加新的抽象判断".repeat(12)}。`);
    expect(errorsFor(listed).some((error) => error.includes("要素罗列"))).toBe(true);
    expect(errorsFor(long).some((error) => error.includes("100 字"))).toBe(true);
  });

  test("allows natural ending variants but requires backstage falsifier and an open question", () => {
    const natural = goodV4Org()
      .replace("往回看，关键一步", "真正的转折发生在")
      .replace("这里说的是网约车的一般运行方式，不是在断言每个平台都使用同样的规则。", "我只讨论网约车常见的运行方式。至于具体公司怎样派单，这里没有核验，也不能据此下判断。")
      .replace("如果拿掉平台对入口和派单的安排，乘客与司机仍能按原样完成这种即时服务，那么这篇解释就站不住。", "另一种材料也可能迫使我们改变看法，例如司机和乘客实际上共同掌握全部规则。")
      .replace("#+falsifier: 如果拿掉平台对入口和派单的安排，服务仍能按原样运行，那么当前解释就需要重写。", "#+falsifier: 若司机和乘客事实上共同掌握全部关键规则，那么当前解释就不成立。");
    const noFalsifier = goodV4Org().replace(/^#\+falsifier: .+\n/mu, "");
    const closed = goodV4Org().replace("到底谁有权修改维持它的规则？", "这些规则最终会得到妥善解决。");
    expect(validateNoteText(orgPath, natural).ok).toBe(true);
    const naturalCondition = goodV4Org().replace(
      "#+falsifier: 如果拿掉平台对入口和派单的安排，服务仍能按原样运行，那么当前解释就需要重写。",
      "#+falsifier: 假如司机和乘客事实上共同掌握全部关键规则，这套解释就失效了。",
    );
    expect(validateNoteText(orgPath, naturalCondition).ok).toBe(true);
    const negatedFalsifier = goodV4Org().replace(
      "#+falsifier: 如果拿掉平台对入口和派单的安排，服务仍能按原样运行，那么当前解释就需要重写。",
      "#+falsifier: 假如缓存命中仍需回源，当前解释依然成立，不需要改写。",
    );
    expect(validateNoteText(orgPath, negatedFalsifier).ok).toBe(true);
    expect(validateNoteText(orgPath, negatedFalsifier).warnings.join("\n")).toContain("需复核");
    expect(errorsFor(noFalsifier).some((error) => error.includes("falsifier"))).toBe(true);
    expect(errorsFor(closed).some((error) => error.includes("真问题"))).toBe(true);
  });

  test("rejects rumor as basis", () => {
    const note = goodV4Org().replace("网约车依靠线上请求、位置匹配和平台派单组织乘客与司机，行程双方都要通过平台规则才能完成。", "听说大家可能都认可平台派单。");
    expect(errorsFor(note).some((error) => error.includes("basis"))).toBe(true);
  });

  test("rejects old contracts, placeholders and Markdown syntax in Org", () => {
    const old = goodV4Org().replace("改变不只在于", "The One 是 X -> Y。改变不只在于");
    const placeholder = goodV4Org().replace("网约车", "{目标}");
    const markdown = goodV4Org().replace("网约车", "[网约车](https://example.com)");
    expect(errorsFor(old).some((error) => error.includes("旧合同"))).toBe(true);
    expect(errorsFor(placeholder).some((error) => error.includes("占位符"))).toBe(true);
    expect(errorsFor(markdown).some((error) => error.includes("Markdown 链接"))).toBe(true);
  });

  test("rejects identifier disagreement", () => {
    const note = goodV4Org().replace("20260823T010203\n#+filetags", "20260823T010204\n#+filetags");
    expect(errorsFor(note).some((error) => error.includes("文件名时间戳"))).toBe(true);
  });
});

describe("ValidateNote v3 compatibility regressions", () => {
  const v3Path = "/tmp/20260823T010203--动词-绩效考核__is.org";
  const v3Errors = (content: string) => validateNoteText(v3Path, content).errors;

  test("still requires choice and justification in the v3 reframing", () => {
    const note = goodV3Org().replace(
      "组织管理者凭什么把工作价值做成可量化奖惩的秩序，而不是保留多方叙述与协商？",
      "绩效考核最终做了什么？",
    );
    expect(v3Errors(note).some((error) => error.includes("凭什么") && error.includes("而不是"))).toBe(true);
  });

  test("still rejects an abstract v3 action", () => {
    const note = goodV3Org().replace(
      "组织管理者以量化评分，把分散工作的价值判断做成可比较、可奖惩的管理秩序。",
      "这是一段长度足够却没有行动者和共同安排的抽象判断。",
    );
    expect(v3Errors(note).some((error) => error.includes("具体创制行动"))).toBe(true);
  });

  test("still requires a real v3 alternative", () => {
    const note = goodV3Org().replace("由同事、客户与本人共同叙述贡献，再公开协商奖惩。", "其他可能");
    expect(v3Errors(note).some((error) => error.includes("未选"))).toBe(true);
  });

  test("still distinguishes v3 back-action from a bad consequence", () => {
    const note = goodV3Org().replace(
      "评分体系一旦成为人事依据，管理者也必须服从指标，难以承认体系没有记录的贡献。",
      "长期加班会让员工疲惫，团队士气也会下降。",
    );
    expect(v3Errors(note).some((error) => error.includes("反制") && error.includes("坏后果"))).toBe(true);
  });

  test("still requires v3 origin to carry a persistent problem", () => {
    const note = goodV3Org().replace(
      "从指标异化的困境逆溯，分析追到组织用统一尺度比较岗位的创建事件；它使「不同工作凭什么可比」持续成为不能删除的问题。",
      "当前能追到的最早创建点是第一次使用评分表。",
    );
    expect(v3Errors(note).some((error) => error.includes("本源"))).toBe(true);
  });

  test("still rejects rumor as v3 evidence", () => {
    const note = goodV3Org().replace("评分连接跨人比较、奖金和晋升，是本分析采用的制度事实。", "听说评分大概能够提高效率。");
    expect(v3Errors(note).some((error) => error.includes("根据"))).toBe(true);
  });

  test("still requires a falsifiable v3 judgment", () => {
    const note = goodV3Org().replace("如果评分不影响任何资源或行动，当前判断就需要重写。", "当前判断仍有待观察。");
    expect(v3Errors(note).some((error) => error.includes("反驳"))).toBe(true);
  });

  test("still rejects The One and the arrow contract in v3", () => {
    const note = goodV3Org().replace("从指标异化的困境逆溯", "The One 是 X -> Y；从指标异化的困境逆溯");
    expect(v3Errors(note).some((error) => error.includes("旧合同"))).toBe(true);
  });
});

describe("ValidateNote CLI review status", () => {
  const script = join(import.meta.dir, "ValidateNote.ts");

  async function runCli(notePath: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const process = Bun.spawn(["bun", script, notePath], { stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
      process.exited,
    ]);
    return { exitCode, stdout, stderr };
  }

  test("prints review_required for a structurally valid note and does not invent a reader pass", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-is-cli-"));
    try {
      const notePath = join(dir, "20260823T010203--理解-目标函数__is.org");
      await writeFile(notePath, goodV5Org());
      const result = await runCli(notePath);
      expect(result.exitCode).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.status).toBe("review_required");
      expect(payload.ok).toBe(true);
      expect(payload.review_required).toBe(true);
      expect(payload.warnings.join("\n")).toContain("不是理解通过");
      expect(JSON.stringify(payload)).not.toContain("NARRATIVE_PASS");
      expect(JSON.stringify(payload)).not.toContain("UNDERSTANDING_PASS");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("exits nonzero when a required field is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-is-cli-bad-"));
    try {
      const notePath = join(dir, "20260823T010203--理解-目标函数__is.org");
      await writeFile(notePath, goodV5Org().replace(/^#\+operation:.*\n/mu, ""));
      const result = await runCli(notePath);
      expect(result.exitCode).toBe(1);
      const payload = JSON.parse(result.stderr);
      expect(payload.status).toBe("error");
      expect(payload.ok).toBe(false);
      expect(payload.review_status).toBe("structural_fail");
      expect(payload.errors.join("\n")).toContain("operation");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
