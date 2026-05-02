import asyncio
from pathlib import Path

import httpx
import yaml
from selectolax.parser import HTMLParser


ROOT = Path(__file__).parent
CORPUS_DIR = ROOT / "corpus"
SOURCES_PATH = ROOT / "sources.yaml"
USER_AGENT = "DoctissimoIAHackathonBot/0.1 (+https://doctissimo-ia.vercel.app)"


def _extract_text(html: str) -> str:
    tree = HTMLParser(html)
    for selector in ["script", "style", "nav", "footer", "aside", "form", "header"]:
        for node in tree.css(selector):
            node.decompose()

    main = (
        tree.css_first("main")
        or tree.css_first("article")
        or tree.css_first('[role="main"]')
        or tree.body
    )
    if main is None:
        return ""

    chunks: list[str] = []
    for node in main.css("h1, h2, h3, p, li"):
        text = " ".join(node.text(separator=" ", strip=True).split())
        if text:
            prefix = ""
            if node.tag in {"h1", "h2"}:
                prefix = "\n## "
            elif node.tag == "h3":
                prefix = "\n### "
            chunks.append(f"{prefix}{text}")
    return "\n\n".join(chunks).strip()


async def main() -> None:
    CORPUS_DIR.mkdir(exist_ok=True)
    sources = yaml.safe_load(SOURCES_PATH.read_text(encoding="utf-8"))
    async with httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT}, follow_redirects=True, timeout=30
    ) as client:
        for idx, source in enumerate(sources, start=1):
            url = source["url"]
            topic = source["topic"]
            source_name = source["source"]
            output = CORPUS_DIR / f"{source_name}_{topic}.md"
            try:
                response = await client.get(url)
                response.raise_for_status()
                text = _extract_text(response.text)
                output.write_text(
                    f"---\nurl: {url}\ntopic: {topic}\nsource: {source_name}\n---\n\n{text}\n",
                    encoding="utf-8",
                )
                print(f"[{idx}/{len(sources)}] {source_name}/{topic} OK ({len(text)} chars)")
            except Exception as exc:
                print(f"[{idx}/{len(sources)}] {source_name}/{topic} ERROR {exc}")
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
