// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

//! Log format detection and field parsing.

mod detector;
mod fields;

pub use detector::{LogFormat, detect_format};
pub use fields::{ParsedLine, parse_line};
