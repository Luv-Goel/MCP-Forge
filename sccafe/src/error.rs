use std::s
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorName {
    DeadlineExceeded,
    NotFound,
    BadRequest,
    Internal,
}

impl fmt::Display for ErrorName {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ErrorName::DeadlineExceeded => write!(f, "DEADLINE_EXCEEDED"),
            ErrorName::NotFound => write!(f, "NOT_FOUND"),
            ErrorName::BadRequest => write!(f, "BAD_REQUEST"),
            ErrorName::Internal => write!(f, "INTERNAL"),
        }
    }
}

#[derive(Clone)]
pub struct Location {
    file: &'static str,
    line: u32,
}

#[derive(Debug, Clone)]
pub struct Error {
    pub name: ErrorName,
    pub message: String,
    pub location: Location,
}
