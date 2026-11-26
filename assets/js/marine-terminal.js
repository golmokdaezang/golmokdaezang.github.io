
/*
 * MARINE OS v2.0
 * 해군 전산망 명령 프롬프트
 * marine-terminal.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    const VERSION = "2.0";


    // =========================================
    // 지원 명령어
    // =========================================

    const commands = {

        help: "명령어 목록 조회",

        whoami: "현재 사용자 정보",

        ver: "운영체제 버전",

        date: "현재 날짜",

        time: "현재 시간",

        status: "전산망 연결 상태",

        systeminfo: "시스템 정보",

        tree: "디렉터리 구조",

        dir: "현재 디렉터리 조회",

        cd: "디렉터리 이동",

        pwd: "현재 경로",

        commander: "소속 대장 정보",

        records: "기록물 목록",

        notice: "본부 공지사항",

        org: "해군 조직 정보",

        rank: "현재 계급",

        personnel: "인사 기록부",

        career: "진급 이력",

        merit: "공적 점수",

        promotion: "진급 가능 여부",

        justice: "소속 대장의 정의관",

        wallpaper: "배경화면 설정",

        cls: "화면 초기화",

        clear: "화면 초기화",

        exit: "명령 프롬프트 종료"

    };


    // =========================================
    // 가상 파일 시스템
    // =========================================

    const directories = {

        "M:": [
            "HQ"
        ],

        "M:\\HQ": [

            "1121",

            "RECORDS",

            "PERSONNEL",

            "INTELLIGENCE",

            "WANTED",

            "SYSTEM"

        ],

        "M:\\HQ\\1121": [

            "REPORTS",

            "NOTES",

            "ARCHIVE"

        ],

        "M:\\HQ\\RECORDS": [

            "BLUE",

            "GREEN",

            "PURPLE",

            "BROWN",

            "AQUA",

            "BLACK"

        ],

        "M:\\HQ\\PERSONNEL": [],

        "M:\\HQ\\INTELLIGENCE": [],

        "M:\\HQ\\WANTED": [],

        "M:\\HQ\\SYSTEM": []

    };


    // =========================================
    // 공통 함수
    // =========================================

    function node(tag, text, cls) {

        const element =
            document.createElement(tag);

        if (text != null) {

            element.textContent = text;

        }

        if (cls) {

            element.className = cls;

        }

        return element;

    }


    function check(result) {

        if (result.error) {

            throw result.error;

        }

        return result.data;

    }


    function validPath(path) {

        if (
            Object.prototype.hasOwnProperty.call(
                directories,
                path
            )
        ) {

            return true;

        }


        const parts = path.split("\\");

        const child = parts.pop();

        const parent = parts.join("\\");


        return Boolean(

            directories[parent]?.includes(child)

        );

    }


    // =========================================
    // 터미널 실행
    // =========================================

    async function mount(
        root,
        client,
        options = {}
    ) {

        const auth = check(

            await client.auth.getUser()

        );


        if (auth.user?.id !== ADMIN_UID) {

            throw new Error(
                "ACCESS DENIED"
            );

        }


        let currentPath = "M:\\HQ\\1121";

        let history = [];

        let historyIndex = 0;

        let busy = false;

        let draft = "";


        const commanderNames = {

            akainu: "아카이누",

            kizaru: "키자루",

            aokiji: "아오키지"

        };


        // =====================================
        // 화면 초기화
        // =====================================

        root.replaceChildren();


        const terminal = node(

            "div",

            null,

            "marine-terminal"

        );


        Object.assign(terminal.style, {

            background: "rgba(12, 16, 20, 0.96)",

            color: "#D4D9DD",

            fontFamily:

                "'D2Coding', 'Consolas', monospace",

            fontSize: "14px",

            lineHeight: "1.7",

            padding: "14px",

            height: "100%",

            minHeight: "260px",

            overflowY: "auto",

            boxSizing: "border-box",

            whiteSpace: "pre-wrap",

            overflowWrap: "anywhere"

        });


        const output = node("div");


        const form = node("form");

        Object.assign(form.style, {

            display: "flex",

            alignItems: "baseline",

            gap: "7px",

            margin: "0"

        });


        const prompt = node(

            "span",

            currentPath + ">"

        );

        prompt.style.color = "#A9C8AD";

        prompt.style.flexShrink = "0";


        const input = node("input");

        input.type = "text";

        input.autocomplete = "off";

        input.spellcheck = false;

        input.setAttribute(
            "aria-label",
            "터미널 명령어"
        );


        Object.assign(input.style, {

            background: "transparent",

            color: "#FFFFFF",

            caretColor: "#FFFFFF",

            border: "none",

            outline: "none",

            boxShadow: "none",

            padding: "0",

            margin: "0",

            flex: "1",

            minWidth: "0",

            font: "inherit"

        });


        form.append(prompt, input);

        terminal.append(output, form);

        root.append(terminal);


        // =====================================
        // 출력 함수
        // =====================================

        function print(
            text = "",
            color = "#D4D9DD"
        ) {

            const line = node(

                "div",

                String(text)

            );

            line.style.color = color;


            output.append(line);


            // 출력이 지나치게 쌓이는 것 방지

            while (
                output.childElementCount > 1000
            ) {

                output.firstElementChild.remove();

            }


            terminal.scrollTop =
                terminal.scrollHeight;

        }


        function error(text) {

            print(

                "[ERROR] " + text,

                "#E38A8A"

            );

        }


        function updatePrompt() {

            prompt.textContent =
                currentPath + ">";

        }


        function boot() {

            print(

                `MARINE OPERATING SYSTEM [Version ${VERSION}]`,

                "#A9C8AD"

            );

            print(
                "Marine Headquarters Internal Network"
            );

            print(
                "Authorized Personnel Only."
            );

            print("");

            print(
                "명령어 목록을 보려면 HELP를 입력하십시오."
            );

            print("");

        }


        // =====================================
        // 인사 정보 조회
        // =====================================

        async function getPersonnel() {

            return check(

                await client

                    .from("marine_personnel")

                    .select("*")

                    .eq("user_id", ADMIN_UID)

                    .single()

            );

        }


        async function getCommander() {

            const person = await getPersonnel();


            return check(

                await client

                    .from("marine_characters")

                    .select("*")

                    .eq(

                        "character_key",

                        person.commander

                    )

                    .single()

            );

        }


        // =====================================
        // 가상 디렉터리 이동
        // =====================================

        function changeDirectory(target) {

            if (!target) {

                print(currentPath);

                return;

            }


            target = target

                .replace(/\//g, "\\")

                .toUpperCase();


            let next;


            if (target === "..") {

                const parts =
                    currentPath.split("\\");


                if (parts.length > 1) {

                    parts.pop();

                }

                next = parts.join("\\");


            } else if (

                target === "\\"

                || target === "M:"

            ) {

                next = "M:";


            } else if (

                target.startsWith("M:\\")

            ) {

                next = target;


            } else if (

                target.startsWith("\\")

            ) {

                next = "M:" + target;


            } else {

                next =

                    currentPath + "\\" + target;

            }


            if (next !== "M:") {

                next = next.replace(/\\+$/, "");

            }


            if (!validPath(next)) {

                error(
                    "지정된 디렉터리를 찾을 수 없습니다."
                );

                return;

            }


            currentPath = next;

            updatePrompt();

        }


        // =====================================
        // TREE 명령어
        // =====================================

        function printTree(path, prefix = "") {

            const children =

                directories[path] || [];


            children.forEach((child, index) => {

                const last =

                    index === children.length - 1;


                print(

                    prefix

                    + (last ? "└── " : "├── ")

                    + child

                );


                printTree(

                    path + "\\" + child,

                    prefix + (last ? "    " : "│   ")

                );

            });

        }


        // =====================================
        // 명령어 처리
        // =====================================

        async function execute(raw) {

            const parts = raw.trim().split(/\s+/);

            const command = parts.shift().toLowerCase();

            const argument = parts.join(" ");


            switch (command) {

                // 명령어 도움말

                case "help":

                    print("지원 명령어 목록");

                    print("------------------------------");

                    for (

                        const [key, description]

                        of Object.entries(commands)

                    ) {

                        print(

                            key.toUpperCase().padEnd(15)

                            + description

                        );

                    }

                    break;


                // 사용자 정보

                case "whoami": {

                    const p = await getPersonnel();

                    print("소속 지부 : " + p.branch);

                    print("소속 부서 : " + p.department);

                    print("현재 계급 : " + p.rank);

                    print(

                        "담당 지휘관 : "

                        + (

                            commanderNames[p.commander]

                            || p.commander

                        )

                        + " 대장"

                    );

                    print(

                        "인증 상태 : AUTHORIZED",

                        "#A9C8AD"

                    );

                    break;

                }


                case "ver":

                    print(

                        `MARINE OS Version ${VERSION}`

                    );

                    break;


                case "date":

                    print(

                        new Date().toLocaleDateString(
                            "ko-KR"
                        )

                    );

                    break;


                case "time":

                    print(

                        new Date().toLocaleTimeString(
                            "ko-KR"
                        )

                    );

                    break;


                // DB 연결 확인

                case "status":

                    await getPersonnel();

                    print(

                        "DATABASE : CONNECTED",

                        "#A9C8AD"

                    );

                    print("AUTH     : AUTHORIZED");

                    print("SYSTEM   : ONLINE");

                    break;


                case "systeminfo":

                    print("SYSTEM : MARINE OS");

                    print("VERSION : " + VERSION);

                    print("DATABASE : SUPABASE");

                    print("ENVIRONMENT : WEB CLIENT");

                    print(

                        "DISPLAY : "

                        + screen.width

                        + " x "

                        + screen.height

                    );

                    print(

                        "LANGUAGE : " + navigator.language

                    );

                    break;


                // 가상 파일 시스템

                case "pwd":

                    print(currentPath);

                    break;


                case "dir":

                    print(

                        "Directory of " + currentPath

                    );

                    print("");


                    for (

                        const name of

                        directories[currentPath] || []

                    ) {

                        print("<DIR>    " + name);

                    }

                    print(

                        (directories[currentPath]?.length || 0)

                        + " directories"

                    );

                    break;


                case "tree":

                    print("M:\\");

                    printTree("M:");

                    break;


                case "cd":

                    changeDirectory(argument);

                    break;


                // 지휘관 정보

                case "commander": {

                    const c = await getCommander();

                    print("이름 : " + c.name);

                    print("별칭 : " + c.alias);

                    print("계급 : " + c.rank);

                    print("부서 : " + c.department);

                    print("정의관 : " + (c.justice || "미등록"));

                    break;

                }


                // 기록물 목록

                case "records": {

                    const rows = check(

                        await client

                            .from("posts")

                            .select(

                                "title,book_key,is_public,updated_at,island_key"

                            )

                            .order(

                                "updated_at",

                                { ascending: false }

                            )

                            .limit(50)

                    );


                    print("중앙 기록국 기록물 목록");

                    print("------------------------------");


                    rows.forEach(row => {

                        print(

                            "["

                            + (row.book_key || row.island_key || "MAP").toUpperCase()

                            + "] "

                            + row.title

                            + (

                                row.is_public

                                    ? " [공개]"

                                    : " [비공개]"

                            )

                        );

                    });


                    print("");

                    print(

                        "조회된 기록물: " + rows.length + "건"

                    );

                    break;

                }


                // 본부 공지

                case "notice": {

                    const rows = check(

                        await client

                            .from("marine_notices")

                            .select("*")

                            .order(

                                "created_at",

                                { ascending: false }

                            )

                            .limit(10)

                    );


                    if (!rows.length) {

                        print("등록된 공지사항이 없습니다.");

                    }


                    rows.forEach(row => {

                        print(

                            "[" + row.sender + "] "

                            + row.title,

                            row.important

                                ? "#E8C580"

                                : "#D4D9DD"

                        );

                        print(row.content);

                        print("");

                    });

                    break;

                }


                // 조직 정보

                case "org": {

                    const rows = check(

                        await client

                            .from("marine_characters")

                            .select(

                                "name,alias,rank,department"

                            )

                    );


                    print("MARINE HEADQUARTERS");

                    print("------------------------------");


                    rows.forEach(row => {

                        print(

                            row.name

                            + (

                                row.alias

                                    ? " (" + row.alias + ")"

                                    : ""

                            )

                            + " / "

                            + row.rank

                            + " / "

                            + row.department

                        );

                    });

                    break;

                }


                case "rank": {

                    const p = await getPersonnel();

                    print("현재 계급 : " + p.rank);

                    break;

                }


                case "personnel": {

                    const p = await getPersonnel();

                    print("군번 : " + p.personnel_code);

                    print("계급 : " + p.rank);

                    print("지부 : " + p.branch);

                    print("부서 : " + p.department);

                    print("담당 업무 : " + p.assignment);

                    print(

                        "등록일 : "

                        + new Date(

                            p.enlisted_at

                        ).toLocaleDateString("ko-KR")

                    );

                    print(

                        "신분 분류 : "

                        + (

                            p.undercover

                                ? "가상 잠입수사 요원"

                                : "일반 해군 인원"

                        )

                    );

                    break;

                }


                // 진급 이력

                case "career": {

                    const rows = check(

                        await client

                            .from("marine_promotions")

                            .select("*")

                            .eq("user_id", ADMIN_UID)

                            .order("promoted_at")

                    );


                    rows.forEach(row => {

                        print(

                            new Date(

                                row.promoted_at

                            ).toLocaleDateString("ko-KR")

                            + " : "

                            + (row.previous_rank || "최초 등록")

                            + " → "

                            + row.new_rank

                        );

                        print("  " + row.reason);

                    });

                    break;

                }


                case "merit": {

                    const p = await getPersonnel();

                    print(

                        "현재 공적 점수 : "

                        + p.merit_points

                        + "점"

                    );

                    print(

                        "진급 기준 : "

                        + p.promotion_threshold

                        + "점"

                    );

                    break;

                }


                case "promotion": {

                    const p = await getPersonnel();


                    if (p.rank === "원수") {

                        print("최고 계급입니다.");

                        break;

                    }


                    const remaining = Math.max(

                        0,

                        p.promotion_threshold

                        - p.merit_points

                    );


                    print("현재 계급 : " + p.rank);

                    print(

                        "진급 심사까지 필요한 점수 : "

                        + remaining

                        + "점"

                    );


                    if (remaining === 0) {

                        print(

                            "진급 심사 신청 가능",

                            "#A9C8AD"

                        );

                    }


                    print(

                        "자세한 사항은 인사 관리 시스템을 이용하십시오."

                    );

                    break;

                }


                case "justice": {

                    const c = await getCommander();

                    print(c.name + " 대장의 정의관");

                    print("");

                    print(c.justice || "미등록");

                    print("");

                    print(

                        "모든 기록은 정의의 증거다.",

                        "#A9C8AD"

                    );

                    break;

                }


                // 환경 설정 연결

                case "wallpaper":

                    if (

                        typeof options.openApp

                        === "function"

                    ) {

                        options.openApp("settings");

                    } else {

                        print(

                            "환경 설정 연결이 필요합니다."

                        );

                    }

                    break;


                // 화면 초기화

                case "clear":

                case "cls":

                    output.replaceChildren();

                    break;


                // 종료

                case "exit":

                    if (

                        typeof options.close

                        === "function"

                    ) {

                        options.close();

                    } else {

                        print(

                            "창 상단의 닫기 버튼을 이용하십시오."

                        );

                    }

                    break;


                default:

                    error(

                        "'" + command

                        + "'은(는) 지원하지 않는 명령어입니다."

                    );

                    print(

                        "HELP를 입력하여 명령어를 확인하십시오."

                    );

            }

        }


        // =====================================
        // 명령어 입력 처리
        // =====================================

        form.onsubmit = async event => {

            event.preventDefault();


            const raw = input.value.trim();


            if (!raw || busy) {

                return;

            }


            print(

                currentPath + "> " + raw,

                "#FFFFFF"

            );


            if (

                history[history.length - 1]

                !== raw

            ) {

                history.push(raw);

            }


            historyIndex = history.length;

            draft = "";

            input.value = "";

            busy = true;

            input.readOnly = true;


            try {

                await execute(raw);

            } catch (err) {

                error(err.message);

            } finally {

                busy = false;

                input.readOnly = false;


                if (root.isConnected) {

                    input.focus();

                    terminal.scrollTop =

                        terminal.scrollHeight;

                }

            }

        };


        // =====================================
        // 키보드 단축키
        // =====================================

        input.onkeydown = event => {

            if (busy) {

                return;

            }


            // 이전 명령어

            if (event.key === "ArrowUp") {

                event.preventDefault();


                if (

                    historyIndex === history.length

                ) {

                    draft = input.value;

                }


                historyIndex = Math.max(

                    0,

                    historyIndex - 1

                );


                input.value =

                    history[historyIndex] || "";

            }


            // 다음 명령어

            if (event.key === "ArrowDown") {

                event.preventDefault();


                historyIndex = Math.min(

                    history.length,

                    historyIndex + 1

                );


                input.value =

                    historyIndex === history.length

                        ? draft

                        : history[historyIndex] || "";

            }


            // TAB 자동 완성

            if (event.key === "Tab") {

                event.preventDefault();


                const value =

                    input.value.trim().toLowerCase();


                const matches =

                    Object.keys(commands).filter(

                        command =>

                            command.startsWith(value)

                    );


                if (matches.length === 1) {

                    input.value = matches[0];

                } else if (matches.length > 1) {

                    print(matches.join("    "));

                }

            }


            // CTRL + L : 화면 초기화

            if (

                event.ctrlKey

                && event.key.toLowerCase() === "l"

            ) {

                event.preventDefault();

                output.replaceChildren();

            }

        };


        terminal.onclick = event => {

            if (

                !window.getSelection()?.toString()

                && event.target !== input

            ) {

                input.focus();

            }

        };


        boot();

        input.focus();

    }


    // =========================================
    // 외부 연결 인터페이스
    // =========================================

    window.MarineTerminal = {

        mount,

        commands

    };

})();
