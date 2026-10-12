# VHSBOARD Site Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wdrożyć wybrane zadania audytu: 1, 4, 5, 11, 12, 14, 15, 16, 17, 18.

**Architecture:** Trzy plany dzielą prace według odpowiedzialności. Zachowujemy statyczny frontend i Supabase CMS; wdrożenie następuje kolejno ze względu na współdzielone pliki.

**Tech Stack:** React 19, TypeScript, TanStack, Tailwind 4, Radix, Supabase, Cloudflare Pages, Bun, Vitest.

**Spec:** [Wspólna specyfikacja](../specs/2026-10-09-site-quality-improvements.md).

## Global Constraints

- Oferty pozostają pobierane przez JavaScript z Supabase.
- Nie wdrażamy rezerwacji, zaliczek, płatności ani kont klientów.
- Hosting pozostaje statycznym Cloudflare Pages; bez Workers i osobnego backendu.
- Nie osłabiamy `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` ani RLS.
- Nie zmieniamy domeny, DNS, produkcyjnych danych ani ustawień kont usług.

## Review Focus

- CMS noindex przed JS — test artefaktu w technicznym zadaniu 1.
- Zmiana preview przy tym samym slug — test routera w technicznym zadaniu 5.
- Stabilne klucze CMS po konwersji zdjęć — test catalogue w media 4a.
- Polish glyphs i OG bez zależności od wygasających URL — odbiór media 15/16.
- Dotyk, klawiatura i dynamiczne reduced motion — testy/odbiór UI 11/14.

---

Branch: `codex/site-quality-improvements` (bazuje na `feature/mobile-tweaks`,
`0d67969`). To indeks trzech planów wykonawczych, nie raport wykonanych zmian.

| Część          | Zadania audytu | Dokument                                           |
| -------------- | -------------- | -------------------------------------------------- |
| Technika i SEO | 5, 1, 18       | [Plan techniczny](2026-10-09-quality-technical.md) |
| Media          | 4, 15, 16      | [Plan mediów](2026-10-09-quality-media.md)         |
| Interfejs      | 11, 12, 14, 17 | [Plan UI](2026-10-09-quality-ui.md)                |

[Wspólna specyfikacja](../specs/2026-10-09-site-quality-improvements.md)
zawiera zakres, ograniczenia, budżety i kryteria odbioru. Zadanie 4 dzieli się
na eksport lokalnych zdjęć i optymalizację nowych uploadów CMS.

Zalecana kolejność: **5 → 1 → 4 → 15 → 16 → 11 → 12 → 14 → 17 → 18**.
Zmiany kończą się małymi commitami, testami zachowania i odbiorem wizualnym.
Nie przełączamy domeny ani nie wdrażamy nic na produkcję w ramach wykonania
tego planu bez osobnego polecenia użytkownika.

Oferty nadal są pobierane przez JavaScript. Dwa ogólne shelle rozdzielą robots
dla ofert i CMS; nie powstaje HTML dla poszczególnych ofert. Oferty dostaną
wspólną, trwałą grafikę OG; boty bez JS nie otrzymają indywidualnej treści
oferty. Nie wdrażamy zaliczek ani płatności.

Po przeglądzie planu wybieramy wykonanie natywne lub z subagentami. Dla tej
zmiany rekomendowane jest wykonanie natywne: wiele zadań dotyka tych samych
plików (`__root.tsx`, `seo.ts`, home i karuzela), a zmiany nie wymagają
operacji na produkcyjnych danych.
