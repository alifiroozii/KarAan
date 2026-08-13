import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";

export const provinces = pgTable(
  "provinces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_provinces_slug").on(table.slug)]
);

export const cities = pgTable(
  "cities",
  {
    id: text("id").primaryKey(),
    provinceId: text("province_id")
      .notNull()
      .references(() => provinces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_cities_province_id").on(table.provinceId),
    index("idx_cities_slug").on(table.slug),
  ]
);

export const districts = pgTable(
  "districts",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_districts_city_id").on(table.cityId)]
);

export const neighborhoods = pgTable(
  "neighborhoods",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_neighborhoods_city_id").on(table.cityId)]
);
