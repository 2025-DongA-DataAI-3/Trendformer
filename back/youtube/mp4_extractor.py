import yt_dlp


# =========================================================
# 10. MP4 URL 추출
# =========================================================
def get_mp4(url):
    try:
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "format": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best",
            "noplaylist": True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if info.get("url"):
                return info["url"]

            requested_formats = info.get("requested_formats", [])
            for f in requested_formats:
                if f.get("ext") == "mp4" and f.get("url"):
                    return f["url"]

            formats = info.get("formats", [])
            for f in reversed(formats):
                if (
                    f.get("ext") == "mp4"
                    and f.get("url")
                    and f.get("vcodec") != "none"
                ):
                    return f["url"]

            return None

    except Exception as e:
        print("MP4 추출 실패:", url)
        print("에러:", e)
        return None