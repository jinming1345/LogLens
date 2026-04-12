//! Log format detection and field parsing.

mod detector;
mod fields;

pub use detector::{LogFormat, detect_format};
pub use fields::{ParsedLine, parse_line};
