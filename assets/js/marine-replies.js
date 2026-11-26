
/*
 * MARINE OS v2.0
 * 캐릭터 자동 답장 시스템
 * marine-replies.js
 */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";


    // =========================================
    // 캐릭터별 대화 데이터
    // =========================================

    const dialogues = {

        akainu: {

            greeting: [
                "무슨 일이지. 용건을 말하도록.",
                "그래. 보고할 사항이 있나?",
                "중앙 기록국의 업무 상황은 어떠한가."
            ],

            submitted: [
                "제출된 기록을 확인했다. 수고했다.",
                "확인했다. 기록의 정확성도 검토하도록.",
                "좋다. 앞으로도 책임감을 갖고 임하도록."
            ],

            missing: [
                "이상하군. 접수된 기록이 확인되지 않는다.",
                "보고 내용과 전산 기록이 일치하지 않는다. 다시 확인하도록.",
                "제출 여부를 확인한 뒤 보고하도록."
            ],

            working: [
                "알겠다. 분석 결과는 정확하게 정리하도록.",
                "진행 상황을 확인했다. 오류가 없도록 검토해라.",
                "분석이 완료되면 보고하도록."
            ],

            rest: [
                "알겠다. 휴식 후 업무에 복귀하도록.",
                "휴식도 컨디션 관리의 일환이다."
            ],

            default: [
                "확인했다.",
                "해당 사항은 검토하도록 하지.",
                "그래. 전달 사항은 확인했다."
            ]

        },


        kizaru: {

            greeting: [
                "그래~ 무슨 일이야..",
                "이 시간에 연락이라니~ 무슨 일인가..",
                "흠.. 하고 싶은 말이라도 있나~?"
            ],

            submitted: [
                "그래.. 보고서 확인했어~ 수고했네.",
                "제법 열심히 하는구만~ 잘했어.",
                "벌써 끝냈나~? 생각보다 빠르네.."
            ],

            missing: [
                "이상하네~? 아직 제출된 기록이 없는데 말이지..",
                "흠.. 전산망에는 안 보이는구만~",
                "저장 버튼은 제대로 누른 거야~?"
            ],

            working: [
                "아직 분석 중인가~? 그렇구만..",
                "그래.. 꼼꼼하게 살펴보라고~",
                "사카즈키한테도 진행 상황은 알려두라고~"
            ],

            rest: [
                "그래~ 쉬는 것도 중요하지..",
                "나도 잠깐 쉬고 있었는데 말이야~"
            ],

            default: [
                "그렇구만~",
                "흠.. 그런 일이 있었어~?",
                "그래~ 알겠어..",
                "재미있는 이야기네~"
            ]

        },


        aokiji: {

            greeting: [
                "아... 무슨 일이야?",
                "응? 나 찾았어?",
                "잠깐 눈 좀 붙이고 있었는데..."
            ],

            submitted: [
                "아... 벌써 올렸어? 수고했어.",
                "그래, 잘했네. 이제 좀 쉬어.",
                "벌써 끝냈다고? 난 아직 내 것도 안 끝냈는데..."
            ],

            missing: [
                "응? 아직 기록이 안 보이는데...",
                "저장 안 된 거 아니야? 한번 확인해 봐.",
                "아... 전산망에 아직 안 뜨네."
            ],

            working: [
                "아직 하는 중이구나. 잘 살펴봐.",
                "그래... 너무 무리하지는 말고.",
                "막히는 부분 있으면 잠깐 쉬었다 해."
            ],

            rest: [
                "그래, 쉬어. 나도 좀 자려고...",
                "좋지. 오늘은 좀 쉬는 것도 괜찮겠네."
            ],

            default: [
                "아... 그래?",
                "그렇구나.",
                "음... 알았어.",
                "그래, 무슨 말인지는 알겠네."
            ]

        },


        smoker: {

            greeting: [
                "어. 무슨 일이냐?",
                "왜, 업무 끝났냐?",
                "그래. 밥은 먹었고?"
            ],

            submitted: [
                "끝냈냐? 수고했다.",
                "잘했네. 이제 좀 쉬어라.",
                "그래. 저녁이나 먹으러 갈까."
            ],

            missing: [
                "아직 접수 안 됐는데? 확인해 봐.",
                "저장 제대로 한 거 맞냐?"
            ],

            working: [
                "아직 분석 중이냐?",
                "그래. 잘 마무리해라.",
                "막히면 잠깐 쉬었다 해."
            ],

            food: [
                "그래. 저녁에 같이 먹자.",
                "뭐 먹을 건데?",
                "타시기한테도 물어봐야겠군.",
                "업무 끝나면 시간 맞춰 보자."
            ],

            rest: [
                "그래. 오늘은 좀 쉬어라.",
                "밥부터 제대로 챙겨 먹고."
            ],

            default: [
                "그래?",
                "알았다.",
                "그런 일이 있었냐."
            ]

        },


        tensei: {

            greeting: [
                "그래. 무슨 일인가?",
                "조사 관련 문의인가?"
            ],

            submitted: [
                "기록을 확인했다. 수고했네.",
                "분석 자료는 확인해 두도록 하지."
            ],

            missing: [
                "현재 접수된 자료는 확인되지 않는군.",
                "기록의 제출 상태를 다시 확인하게."
            ],

            working: [
                "알겠네. 분석 과정도 기록해 두도록.",
                "결과뿐 아니라 근거도 중요하네."
            ],

            default: [
                "그렇군.",
                "확인해 두겠네."
            ]

        },


        tsuru: {

            greeting: [
                "그래요. 무슨 일이죠?",
                "기록물에 관한 문의인가요?"
            ],

            submitted: [
                "제출된 기록을 확인했습니다. 수고했어요.",
                "잘했습니다. 정리 상태도 확인해 볼게요."
            ],

            missing: [
                "아직 접수된 기록이 확인되지 않는군요.",
                "저장 상태를 다시 확인해 보세요."
            ],

            working: [
                "진행 중이군요. 차근차근 확인하세요.",
                "기록은 정확하게 남기는 것이 중요합니다."
            ],

            default: [
                "그렇군요.",
                "네. 확인했습니다."
            ]

        },


        sengoku: {

            greeting: [
                "그래. 용건이 무엇인가.",
                "본부에 보고할 사항이 있나?"
            ],

            submitted: [
                "보고를 확인했다. 수고했네."
            ],

            missing: [
                "접수 기록을 확인한 뒤 다시 보고하게."
            ],

            default: [
                "알겠다. 전달 사항은 확인했다."
            ]

        },


        garp: {

            greeting: [
                "하하하! 무슨 일이냐!",
                "오, 신입이군!"
            ],

            submitted: [
                "하하하! 제법인데!",
                "그래! 잘했구나!"
            ],

            missing: [
                "아직 안 올라왔는데? 다시 확인해 봐라!"
            ],

            rest: [
                "하하하! 푹 쉬어라!"
            ],

            default: [
                "하하하! 그렇구나!",
                "그래, 알았다!"
            ]

        },


        tashigi: {

            greeting: [
                "안녕하세요. 무슨 일이신가요?",
                "네! 말씀하세요."
            ],

            submitted: [
                "보고서 제출을 확인했습니다!",
                "수고하셨습니다!"
            ],

            missing: [
                "아직 접수된 기록이 없는 것 같습니다."
            ],

            food: [
                "저녁 약속인가요?",
                "스모커 대령님께도 말씀드릴게요."
            ],

            default: [
                "네, 알겠습니다.",
                "확인했습니다!"
            ]

        }

    };


    // =========================================
    // 공통 함수
    // =========================================

    function check(result) {

        if (result.error) {
            throw result.error;
        }

        return result.data;

    }


    function randomItem(items) {

        return items[
            Math.floor(Math.random() * items.length)
        ];

    }


    // =========================================
    // 최근 보고서 제출 기록 확인
    // =========================================

    async function checkReport(client) {

        const since = new Date(
            Date.now() - 24 * 60 * 60 * 1000
        ).toISOString();

        const rows = check(

            await client
                .from("marine_activity")
                .select(
                    "id,title,post_id,activity_type,created_at"
                )
                .eq("user_id", ADMIN_UID)
                .not("post_id", "is", null)
                .gt("points", 0)
                .gte("created_at", since)
                .order(
                    "created_at",
                    { ascending: false }
                )
                .limit(1)

        );

        return rows[0] || null;

    }


    // =========================================
    // 메시지 내용 분류
    // =========================================

async function classify(client, message) {

    const text = message.trim();

    // 01. 사과

    if (/죄송|미안|사과드립니다|사과합니다/.test(text)) {
        return "apology";
    }


    // 02. 휴식 및 피로

    if (/쉬고|쉴래|휴식|피곤|자러|졸려|힘들어/.test(text)) {
        return "rest";
    }


    // 03. 업무 미완료

    if (
        /아직.*(못|안)|분석\s*중|작성\s*중|미제출|제출\s*전|하는\s*중|못\s*했/.test(text)
    ) {
        return "working";
    }


    // 04. 보고서 제출 여부 확인

    if (
        /제출\s*(했|완료|했습니다)|저장\s*(했|완료)|보고\s*완료|다\s*했|작성\s*완료/.test(text)
    ) {

        const report = await checkReport(client);

        return report
            ? "submitted"
            : "missing";

    }


    // 05. 칭찬

    if (/멋있|멋지|대단하|최고|존경|잘생겼/.test(text)) {
        return "compliment";
    }


    // 06. 장난 및 실없는 소리

    if (
        /심심해|심심합니다|놀아줘|놀아주세요|메롱|바보|장난이|농담이|^ㅋ{2,}$|^ㅎ{2,}$/.test(text)
    ) {
        return "joke";
    }


    // 07. 식사

    if (/저녁|점심|밥|식사|배고파/.test(text)) {
        return "food";
    }


    // 08. 질문

    if (/궁금|질문|어떻게|왜요|무엇|뭔가요/.test(text)) {
        return "question";
    }


    // 09. 인사

    if (
        /안녕|좋은\s*아침|계세요|뭐해|뭐\s*하세요/.test(text)
    ) {
        return "greeting";
    }


    // 10. 업무 진행

    if (/분석|연구|공부|작업|작성|진행/.test(text)) {
        return "working";
    }


    // 11. 일반적인 일상 대화

    return "daily";

}

    // =========================================
    // 직전 답장과 동일한 문장 제외
    // =========================================

    async function chooseReply(
        client,
        characterKey,
        candidates
    ) {

        const rows = check(

            await client
                .from("marine_messages")
                .select("content")
                .eq("user_id", ADMIN_UID)
                .eq("direction", "incoming")
                .contains("metadata", {
                    character_key: characterKey
                })
                .order(
                    "created_at",
                    { ascending: false }
                )
                .limit(1)

        );

        const previous = rows[0]?.content;

        const available = candidates.filter(
            text => text !== previous
        );

        return randomItem(
            available.length
                ? available
                : candidates
        );

    }


    // =========================================
    // 개인 메시지 자동 답장 예약
    // =========================================

async function loadCustomReply(client, characterKey, type) {

    const rows = check(

        await client
            .from("marine_dialogues")
            .select("id,content,choices")
            .eq("character_key", characterKey)
            .eq("category", type)
            .eq("enabled", true)

    );

    if (!rows.length) {
        return null;
    }

    const content = await chooseReply(
        client,
        characterKey,
        rows.map(row => row.content)
    );

    return randomItem(
        rows.filter(row => row.content === content)
    );

}

    async function reply(
        client,
        characterKey,
        message,
        roomId = null,
        replyTo = null
    ) {

        const auth = check(
            await client.auth.getUser()
        );

        if (auth.user?.id !== ADMIN_UID) {
            throw new Error("접근 권한 없음");
        }


        const character = check(

            await client
                .from("marine_characters")
                .select("character_key,name")
                .eq(
                    "character_key",
                    characterKey
                )
                .maybeSingle()

        );

        if (!character) {
            return;
        }


const profile = dialogues[characterKey] || {

    default: ["그래. 무슨 이야기인가?"]

};


const type = await classify(client, message);


let custom = null;


try {

    custom = await loadCustomReply(client, characterKey, type);
    if (!custom && type !== "default") custom = await loadCustomReply(client, characterKey, "default");

} catch (error) {

    console.warn("사용자 대사 조회 실패", error);

}


const candidates =
    profile[type] || profile.default;


const content = custom
    ? custom.content
    : await chooseReply(
        client,
        characterKey,
        candidates
    );


const choices = custom &&
    Array.isArray(custom.choices)
        ? custom.choices
        : [];

        // 캐릭터에 따른 답장 시간

        let seconds;

        switch (characterKey) {

            case "akainu":
                seconds = 3 + Math.random() * 7;
                break;

            case "kizaru":
                seconds = 5 + Math.random() * 15;
                break;

            case "aokiji":
                seconds = 10 + Math.random() * 35;
                break;

            case "smoker":
                seconds = 3 + Math.random() * 12;
                break;

            default:
                seconds = 5 + Math.random() * 15;

        }


        const deliverAt = new Date(

            Date.now() + seconds * 1000

        ).toISOString();


        check(

            await client
                .from("marine_messages")
                .insert({

                    user_id: ADMIN_UID,

                    room_id: roomId,

                    sender: character.name,

                    direction: "incoming",

                    content,
choices,

                    reply_to: replyTo,

                    message_type: "text",

                    deliver_at: deliverAt,

                    metadata: {

                        character_key:
                            characterKey,

                        automatic: true,

                        response_type: type

                    }

                })

        );

    }


    // =========================================
    // 단톡방 자동 답장
    // =========================================

    async function groupReply(
        client,
        roomId,
        message,
        replyTo = null
    ) {

        const members = check(

            await client
                .from("marine_room_members")
                .select("character_key")
                .eq("room_id", roomId)

        );


        const characters = check(

            await client
                .from("marine_characters")
                .select("character_key,name,alias")

        );


        const available = characters.filter(

            c => members.some(

                m => m.character_key
                    === c.character_key

            )

        );


        if (!available.length) {
            return;
        }


        // 이름 또는 별칭으로 멘션 확인

        const mentioned = available.filter(

            c =>

                message.includes(
                    "@" + c.name
                )

                || (

                    c.alias

                    && message.includes(
                        "@" + c.alias
                    )

                )

        );


        const selected = mentioned.length

            ? mentioned.slice(0, 3)

            : [randomItem(available)];


        for (const character of selected) {

            await reply(

                client,

                character.character_key,

                message,

                roomId,

                replyTo

            );

        }

    }


    // =========================================
    // 외부 연결 인터페이스
    // =========================================

    window.MarineReplies = {

        reply,

        groupReply

    };

})();
