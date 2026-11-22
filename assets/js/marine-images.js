
/* ============================================
   MARINE OS v2.1
   Image Upload Management
   ============================================ */

(() => {

    "use strict";

    const ADMIN_UID =
        "6e6288e5-3612-4d2f-8d8b-fb08007d86a9";

    const BUCKET = "marine-images";

    const MAX_SIZE = 5 * 1024 * 1024;

    const TYPES = {

        "image/jpeg": "jpg",

        "image/png": "png",

        "image/webp": "webp"

    };


    /* ========================================
       01. 공통 함수
       ======================================== */

    function node(tag, text, cls) {

        const element = document.createElement(tag);

        if (text != null) {

            element.textContent = text;

        }

        if (cls) {

            element.className = cls;

        }

        return element;

    }


    function safeURL(value) {

        try {

            const url = new URL(

                value,

                location.origin

            );

            return url.protocol === "https:"
                ? url.href
                : "";

        } catch {

            return "";

        }

    }


    /* ========================================
       02. 관리자 인증
       ======================================== */

    async function authorize(client) {

        const { data, error } =
            await client.auth.getUser();

        if (error) {

            throw error;

        }

        if (data.user?.id !== ADMIN_UID) {

            throw new Error("접근 권한이 없습니다.");

        }

        return data.user;

    }


    /* ========================================
       03. 이미지 검증
       ======================================== */

    async function validate(file) {

        if (!file) {

            throw new Error("이미지를 선택하세요.");

        }

        if (!TYPES[file.type]) {

            throw new Error(

                "JPG, PNG, WEBP 파일만 등록할 수 있습니다."

            );

        }

        if (file.size > MAX_SIZE) {

            throw new Error(

                "이미지 크기는 최대 5MB입니다."

            );

        }

        const bitmap = await createImageBitmap(file);

        const valid =

            bitmap.width > 0

            && bitmap.height > 0

            && bitmap.width <= 8000

            && bitmap.height <= 8000;

        bitmap.close();

        if (!valid) {

            throw new Error(

                "이미지 해상도를 확인하세요."

            );

        }

    }


    /* ========================================
       04. Supabase Storage 업로드
       ======================================== */

    async function upload(client, file, category) {

        const user = await authorize(client);

        await validate(file);

        const allowed = [

            "characters",

            "wanted"

        ];

        if (!allowed.includes(category)) {

            throw new Error("잘못된 이미지 분류입니다.");

        }

        const extension = TYPES[file.type];

        const path =

            user.id

            + "/" + category

            + "/" + crypto.randomUUID()

            + "." + extension;


        const { error } = await client.storage

            .from(BUCKET)

            .upload(path, file, {

                contentType: file.type,

                cacheControl: "3600",

                upsert: false

            });


        if (error) {

            throw error;

        }


        const { data } = client.storage

            .from(BUCKET)

            .getPublicUrl(path);


        return data.publicUrl;

    }


    /* ========================================
       05. 이미지 선택 인터페이스
       ======================================== */

    function attach(input, client, category) {

        if (!input || !input.parentNode) {

            return;

        }

        const panel = node(

            "div",

            null,

            "mi-panel"

        );

        const preview = node(

            "div",

            null,

            "mi-preview"

        );

        const photo = node("img");

        photo.alt = "등록 이미지 미리보기";

        const placeholder = node(

            "span",

            "등록된 이미지 없음",

            "mi-placeholder"

        );

        preview.append(photo, placeholder);


        function refreshPreview() {

            const url = input.value.trim();

            const safe = url ? safeURL(url) : "";

            photo.hidden = !safe;

            placeholder.hidden = Boolean(safe);

            if (safe) {

                photo.src = safe;

            } else {

                photo.removeAttribute("src");

            }

        }


        photo.onerror = () => {

            photo.hidden = true;

            placeholder.hidden = false;

            placeholder.textContent =

                "이미지 미리보기 실패";

        };


        const fileInput = node("input");

        fileInput.type = "file";

        fileInput.accept =

            "image/jpeg,image/png,image/webp";

        fileInput.hidden = true;


        const choose = node(

            "button",

            "이미지 파일 선택",

            "mi-select ui-primary"

        );

        choose.type = "button";

        choose.onclick = () => fileInput.click();


        const remove = node(

            "button",

            "이미지 연결 해제",

            "mi-remove"

        );

        remove.type = "button";


        const status = node(

            "p",

            "JPG, PNG, WEBP · 최대 5MB",

            "mi-status"

        );


        remove.onclick = () => {

            input.value = "";

            placeholder.textContent =

                "등록된 이미지 없음";

            refreshPreview();

            status.textContent =

                "기록 저장 버튼을 누르면 반영됩니다.";

        };


        const actions = node(

            "div",

            null,

            "mi-actions"

        );

        actions.append(choose, remove);


        /* ====================================
           06. 파일 선택 및 업로드
           ==================================== */

        fileInput.onchange = async () => {

            const file = fileInput.files?.[0];

            if (!file) {

                return;

            }

            choose.disabled = true;

            remove.disabled = true;

            input.disabled = true;

            status.textContent = "이미지 확인 중...";


            try {

                await validate(file);

                status.textContent =

                    "이미지를 업로드하고 있습니다...";


                const url = await upload(

                    client,

                    file,

                    category

                );


                input.value = url;

                refreshPreview();


                status.textContent =

                    "업로드 완료. 기존 저장 버튼을 눌러주세요.";


            } catch (error) {

                status.textContent =

                    "업로드 실패: " + error.message;

            } finally {

                choose.disabled = false;

                remove.disabled = false;

                input.disabled = false;

                fileInput.value = "";

            }

        };


        input.addEventListener(

            "change",

            refreshPreview

        );


        panel.append(

            preview,

            fileInput,

            actions,

            status

        );


        input.insertAdjacentElement(

            "afterend",

            panel

        );

        refreshPreview();

        return panel;

    }


    /* ========================================
       07. 외부 인터페이스
       ======================================== */

    window.MarineImages = {

        upload,

        attach,

        validate

    };

})();
