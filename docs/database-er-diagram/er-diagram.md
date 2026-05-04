// Finlytic Database Schema
// Last updated: 2026-05-03

Table users {
  id uuid [pk, default: `gen_random_uuid()`]
  email varchar(255) [unique, not null]
  password_hash varchar(255) [not null]
  display_name varchar(100)
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table categories {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [ref: > users.id, not null]
  name varchar(100) [not null]
  type varchar(20) [note: 'income or expense']
  color varchar(7) [note: 'hex color']
  is_default boolean [default: false]
  created_at timestamp [default: `now()`]

  indexes {
    (user_id, name) [unique]
  }
}

Table transactions {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [ref: > users.id, not null]
  category_id uuid [ref: > categories.id]
  amount decimal(12,2) [not null]
  type varchar(20) [not null, note: 'income or expense']
  description varchar(500)
  transaction_date date [not null]
  ai_categorized boolean [default: false]
  ai_confidence decimal(3,2) [note: '0.00 to 1.00']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  indexes {
    (user_id, transaction_date)
    user_id
  }
}

Table budgets {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [ref: > users.id, not null]
  category_id uuid [ref: > categories.id, not null]
  amount decimal(12,2) [not null]
  period varchar(20) [note: 'monthly, yearly']
  start_date date [not null]
  end_date date
  created_at timestamp [default: `now()`]
}