import os
import yt_dlp

COOKIE_PATH = os.path.join(os.path.dirname(__file__), "cookies.txt")


def get_mp4(url):
    try:
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "format": "best",
            "noplaylist": True,
        }

        if os.path.exists(COOKIE_PATH):
            ydl_opts["cookiefile"] = COOKIE_PATH

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if info.get("url"):
                return info["url"]

            requested_formats = info.get("requested_formats", [])
            for f in requested_formats:
                if f.get("url"):
                    return f["url"]

            formats = info.get("formats", [])
            for f in reversed(formats):
                if f.get("url") and f.get("vcodec") != "none":
                    return f["url"]

            return None

    except Exception as e:
        print("MP4 추출 실패:", url)
        print("에러:", e)
        return None