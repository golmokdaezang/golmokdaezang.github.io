
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

    const dialogues = {};

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
