use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Edge {
    Left,
    Right,
}

#[derive(Clone, Copy)]
pub struct Area {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

pub fn bounded_position(
    area: Area,
    size: (u32, u32),
    position: (i32, i32),
    edge: Option<Edge>,
    peeking: bool,
) -> (i32, i32) {
    let (width, height) = size;
    let right = area.x + area.width.saturating_sub(width) as i32;
    let bottom = area.y + area.height.saturating_sub(height) as i32;
    let x = match edge {
        Some(Edge::Left) => area.x - if peeking { (width as f64 * 0.42) as i32 } else { 0 },
        Some(Edge::Right) => right + if peeking { (width as f64 * 0.42) as i32 } else { 0 },
        None => position.0.clamp(area.x, right),
    };
    (x, position.1.clamp(area.y, bottom))
}

pub fn nearby_edge(area: Area, size: (u32, u32), position: (i32, i32), scale: f64) -> Option<Edge> {
    let left = (position.0 - area.x).abs();
    let right = (area.x + area.width as i32 - size.0 as i32 - position.0).abs();
    let threshold = (36.0 * scale) as i32;
    if left.min(right) > threshold {
        None
    } else if left <= right {
        Some(Edge::Left)
    } else {
        Some(Edge::Right)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn docks_peeks_and_recovers_with_negative_monitor_origin() {
        let area = Area { x: -1920, y: 0, width: 1920, height: 1040 };
        assert_eq!(bounded_position(area, (340, 420), (-1800, 900), Some(Edge::Left), true), (-2062, 620));
        assert_eq!(bounded_position(area, (340, 420), (-2062, 620), Some(Edge::Left), false), (-1920, 620));
        assert_eq!(bounded_position(area, (340, 420), (500, -80), Some(Edge::Right), true), (-198, 0));
        assert_eq!(nearby_edge(area, (340, 420), (-1900, 10), 1.0), Some(Edge::Left));
        assert_eq!(nearby_edge(area, (340, 420), (-900, 10), 1.0), None);
    }
}
