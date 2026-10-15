use serde::Serialize;
use std::time::Duration;

#[derive(Serialize)]
pub struct Source {
    title: String,
    url: String,
    snippet: String,
}

fn bounded(text: &str, count: usize) -> String {
    text.chars().take(count).collect()
}

#[tauri::command]
pub async fn internet_search(query: String) -> Result<Vec<Source>, String> {
    if query.trim().is_empty() || query.chars().count() > 600 {
        return Err("Search needs a question under 600 characters".into());
    }
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent("ProjectRuby/0.4 (user-requested search)")
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .get("https://www.bing.com/search")
        .query(&[("format", "rss"), ("q", query.as_str())])
        .send()
        .await
        .map_err(|_| "Internet search could not connect. Check your connection or turn online mode off.")?;
    if !response.status().is_success() {
        return Err("Search is unavailable. Try again or open Google AI Mode.".into());
    }
    // Bound network content before parsing. A search result cannot request another URL or action.
    let mut response = response;
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        if bytes.len() + chunk.len() > 1_000_000 {
            return Err("Search response exceeded its size limit".into());
        }
        bytes.extend_from_slice(&chunk);
    }
    parse_results(&String::from_utf8_lossy(&bytes))
}

fn parse_results(xml: &str) -> Result<Vec<Source>, String> {
    let document = roxmltree::Document::parse(xml)
        .map_err(|_| "Search returned an unreadable response. Try Google AI Mode.")?;
    let mut sources = Vec::new();
    for item in document.descendants().filter(|n| n.has_tag_name("item")) {
        let field = |name| item.children().find(|n| n.has_tag_name(name)).and_then(|n| n.text()).unwrap_or("");
        let url = field("link");
        if !url.starts_with("https://") || url.len() > 2000 {
            continue;
        }
        sources.push(Source { title: bounded(field("title"), 150), url: url.into(), snippet: bounded(field("description"), 550) });
        if sources.len() == 3 { break; }
    }
    if sources.is_empty() { return Err("No usable search results. Try a more specific question or Google AI Mode.".into()); }
    Ok(sources)
}

#[tauri::command]
pub fn open_web_url(url: String) -> Result<(), String> {
    let parsed = reqwest::Url::parse(&url).map_err(|_| "Invalid link")?;
    if parsed.scheme() != "https" || parsed.host_str().is_none() || url.len() > 3000 {
        return Err("Only HTTPS web links can open".into());
    }
    #[cfg(windows)]
    {
        use std::os::windows::ffi::OsStrExt;
        #[link(name = "shell32")]
        unsafe extern "system" {
            fn ShellExecuteW(window: isize, operation: *const u16, file: *const u16, parameters: *const u16, directory: *const u16, show: i32) -> isize;
        }
        let wide: Vec<u16> = std::ffi::OsStr::new(&url).encode_wide().chain(Some(0)).collect();
        let result = unsafe { ShellExecuteW(0, std::ptr::null(), wide.as_ptr(), std::ptr::null(), std::ptr::null(), 1) };
        if result <= 32 { return Err("Windows could not open your browser".into()); }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn results_are_bounded_https_data() {
        let result = parse_results("<rss><channel><item><title>A &amp; B</title><link>https://example.com</link><description>Evidence</description></item><item><link>javascript:alert(1)</link></item></channel></rss>").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].title, "A & B");
        assert!(parse_results("blocked").is_err());
    }
}
