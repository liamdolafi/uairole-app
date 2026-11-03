import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, LocateFixed, SlidersHorizontal, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, PanResponder, Pressable, ScrollView, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/components/auth-provider";
import { CATEGORY_ICON, Icon } from "@/components/icons";
import { Button, Chip, Row, T } from "@/components/ui";
import {
  AGE_OPTIONS,
  allowedAges,
  countActive,
  DIST_MAX,
  PRICE_MAX,
  PRICE_STEP,
  priceRangeLabel,
  SORT_OPTIONS,
  WHEN_OPTIONS,
  type Filters,
} from "@/lib/filters";
import { ageFromBirth, ymd } from "@/lib/format";
import { C, R, TOUCH } from "@/lib/theme";
import { CATEGORIES } from "@/lib/types";
import { locateNow, useFilters, useHere } from "@/lib/use-filters";

/** Idade de quem está usando (null = visitante ou sem data) */
export function useMyAge() {
  const { profile } = useAuth();
  return profile?.birth_date ? ageFromBirth(profile.birth_date) : null;
}

/** Botão "Filtros" com o número de filtros ligados */
export function FiltersButton({ onPress }: { onPress: () => void }) {
  const { filters } = useFilters();
  const n = countActive(filters);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={n ? `Filtros, ${n} ligado${n > 1 ? "s" : ""}` : "Filtros"}
      style={{
        height: TOUCH + 2,
        paddingHorizontal: 14,
        borderRadius: R.full,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: n ? C.accentStrong : C.surface,
        borderWidth: 1,
        borderColor: n ? C.accentStrong : C.line,
      }}
    >
      <Icon icon={SlidersHorizontal} size={18} color={n ? C.white : C.ink} />
      <T size={14} weight="semibold" color={n ? C.white : C.ink}>
        Filtros
      </T>
      {n ? (
        <View style={{ backgroundColor: C.white, borderRadius: R.full, paddingHorizontal: 6, minWidth: 20, alignItems: "center" }}>
          <T size={12} weight="bold" color={C.accentStrong}>
            {n}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}

const THUMB = 30;

/** Barra com uma ou duas bolinhas. Arrasta com o dedo; leitor de tela usa "ajustável". */
export function Slider({
  min,
  max,
  step,
  low,
  high,
  onChange,
  labels,
  format,
}: {
  min: number;
  max: number;
  step: number;
  low?: number; // sem "low" = uma bolinha só
  high: number;
  onChange: (low: number, high: number) => void;
  labels: [string, string];
  format: (v: number) => string;
}) {
  const [w, setW] = useState(0);
  const dual = low !== undefined;
  const lo = low ?? min;
  const state = useRef({ lo, high, w, startLo: lo, startHigh: high });
  const cb = useRef(onChange);
  useEffect(() => {
    state.current.lo = lo;
    state.current.high = high;
    state.current.w = w;
    cb.current = onChange;
  });

  const track = Math.max(1, w - THUMB);
  const toX = (v: number) => ((v - min) / (max - min)) * track;
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));

  const make = (which: "lo" | "hi") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        state.current.startLo = state.current.lo;
        state.current.startHigh = state.current.high;
      },
      onPanResponderMove: (_, g) => {
        const t = Math.max(1, state.current.w - THUMB);
        const delta = (g.dx / t) * (max - min);
        if (which === "lo") {
          const v = Math.min(snap(state.current.startLo + delta), state.current.high);
          if (v !== state.current.lo) {
            Haptics.selectionAsync().catch(() => {});
            cb.current(v, state.current.high);
          }
        } else {
          const v = Math.max(snap(state.current.startHigh + delta), dual ? state.current.lo : min);
          if (v !== state.current.high) {
            Haptics.selectionAsync().catch(() => {});
            cb.current(state.current.lo, v);
          }
        }
      },
    });
  // os refs só são lidos dentro dos gestos (não durante o render)
  // eslint-disable-next-line react-hooks/refs
  const [pans] = useState(() => ({ lo: make("lo"), hi: make("hi") }));

  const thumb = (which: "lo" | "hi", v: number, pan: ReturnType<typeof make>) => (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={which === "lo" ? labels[0] : labels[1]}
      accessibilityValue={{ text: format(v) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        const d = e.nativeEvent.actionName === "increment" ? step : -step;
        if (which === "lo") onChange(Math.min(snap(lo + d), high), high);
        else onChange(lo, Math.max(snap(high + d), dual ? lo : min));
      }}
      hitSlop={10}
      style={{
        position: "absolute",
        left: toX(v),
        top: (TOUCH - THUMB) / 2,
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB / 2,
        backgroundColor: C.white,
        borderWidth: 4,
        borderColor: C.accentStrong,
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    />
  );

  return (
    <View style={{ height: TOUCH }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      <View style={{ position: "absolute", left: THUMB / 2, right: THUMB / 2, top: TOUCH / 2 - 3, height: 6, borderRadius: 3, backgroundColor: C.line }} />
      {w ? (
        <View
          style={{
            position: "absolute",
            left: THUMB / 2 + toX(lo),
            width: Math.max(0, toX(high) - toX(lo)),
            top: TOUCH / 2 - 3,
            height: 6,
            borderRadius: 3,
            backgroundColor: C.accent,
          }}
        />
      ) : null}
      {w && dual ? thumb("lo", lo, pans.lo) : null}
      {w ? thumb("hi", high, pans.hi) : null}
    </View>
  );
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Calendário: toca no primeiro dia e depois no último */
export function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const today = ymd(new Date());
  const [month, setMonth] = useState((from || today).slice(0, 7));
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  while (cells.length % 7) cells.push(null);
  const move = (d: number) => {
    const n = new Date(Date.UTC(y, m - 1 + d, 1));
    setMonth(`${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const pick = (d: string) => {
    if (!from || (from && to) || d < from) onChange(d, "");
    else onChange(from, d);
  };
  const canBack = month > today.slice(0, 7);
  return (
    <View style={{ backgroundColor: C.bg, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 8 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Pressable onPress={() => move(-1)} disabled={!canBack} accessibilityLabel="Mês anterior" style={{ width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center", opacity: canBack ? 1 : 0.3 }}>
          <Icon icon={ChevronLeft} size={20} />
        </Pressable>
        <T weight="semibold" style={{ textTransform: "capitalize" }}>
          {MONTHS[m - 1]} {y}
        </T>
        <Pressable onPress={() => move(1)} accessibilityLabel="Próximo mês" style={{ width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" }}>
          <Icon icon={ChevronRight} size={20} />
        </Pressable>
      </Row>
      <View style={{ flexDirection: "row" }}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <T key={i} size={11} color={C.muted} center style={{ flex: 1, paddingVertical: 4 }}>
            {d}
          </T>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: "row" }}>
          {cells.slice(row * 7, row * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={{ flex: 1, height: TOUCH }} />;
            const past = d < today;
            const end = to || from;
            const inRange = !!from && d >= from && d <= end;
            const edge = d === from || d === to;
            return (
              <Pressable
                key={d}
                disabled={past}
                onPress={() => pick(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: inRange, disabled: past }}
                accessibilityLabel={`${Number(d.slice(8))} de ${MONTHS[m - 1]}`}
                style={{ flex: 1, height: TOUCH, alignItems: "center", justifyContent: "center", backgroundColor: inRange && !edge ? `${C.accent}33` : "transparent", opacity: past ? 0.25 : 1 }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: edge ? C.accentStrong : "transparent" }}>
                  <T size={14} weight={edge || d === today ? "bold" : "regular"} color={edge ? C.white : d === today ? C.accent : C.ink}>
                    {Number(d.slice(8))}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Section({ title, value, children }: { title: string; value?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: `${C.line}99` }}>
      <Row style={{ justifyContent: "space-between" }}>
        <T weight="semibold">{title}</T>
        {value ? <T size={13} color={C.muted}>{value}</T> : null}
      </Row>
      {children}
    </View>
  );
}

const dateBR = (d: string) => (d ? `${d.slice(8)}/${d.slice(5, 7)}` : "");

/** Gaveta de filtros (sobe de baixo) */
export function FilterSheet({ open, onClose, hoods, resultCount }: { open: boolean; onClose: () => void; hoods: string[]; resultCount?: number }) {
  const insets = useSafeAreaInsets();
  const { filters, setFilters, clear } = useFilters();
  const here = useHere();
  const age = useMyAge();
  const ages = allowedAges(age);
  const [locErr, setLocErr] = useState("");
  const [locBusy, setLocBusy] = useState(false);
  const [scrollOn, setScrollOn] = useState(true);
  const set = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const n = countActive(filters);
  const needsLocation = (filters.distanceKm > 0 || filters.sort === "perto") && !here;

  const whenValue = useMemo(() => {
    if (filters.when !== "datas") return undefined;
    return filters.to && filters.to !== filters.from ? `${dateBR(filters.from)} a ${dateBR(filters.to)}` : dateBR(filters.from);
  }, [filters]);

  async function askLocation() {
    setLocErr("");
    setLocBusy(true);
    try {
      await locateNow();
    } catch (e) {
      setLocErr((e as Error).message);
    }
    setLocBusy(false);
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "#000a" }} onPress={onClose} accessibilityLabel="Fechar filtros" />
        <View style={{ maxHeight: "92%", backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, borderWidth: 1, borderColor: C.line }}>
          <Row style={{ justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${C.line}99` }}>
            <T size={18} weight="display">
              Filtros
            </T>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar filtros" style={{ width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center", marginRight: -10 }}>
              <Icon icon={X} size={22} color={C.muted} />
            </Pressable>
          </Row>

          <ScrollView style={{ paddingHorizontal: 20 }} scrollEnabled={scrollOn} keyboardShouldPersistTaps="handled">
            <Section title="Ordenar por">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {SORT_OPTIONS.map((o) => (
                  <Chip key={o.id} active={filters.sort === o.id} onPress={() => set({ sort: o.id })}>
                    {o.label}
                  </Chip>
                ))}
              </View>
            </Section>

            <Section title="Quando" value={whenValue}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {WHEN_OPTIONS.map((o) => (
                  <Chip
                    key={o.id}
                    active={filters.when === o.id}
                    onPress={() => set(o.id === "datas" ? { when: "datas", from: filters.from || ymd(new Date()), to: filters.to } : { when: o.id })}
                  >
                    {o.label}
                  </Chip>
                ))}
              </View>
              {filters.when === "datas" ? <DateRangePicker from={filters.from} to={filters.to} onChange={(from, to) => set({ from, to })} /> : null}
            </Section>

            <Section title="Categoria" value={filters.cats.length ? `${filters.cats.length} escolhida${filters.cats.length > 1 ? "s" : ""}` : "Todas"}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((c) => {
                  const on = filters.cats.includes(c.id);
                  return (
                    <Chip key={c.id} icon={CATEGORY_ICON[c.id]} active={on} onPress={() => set({ cats: on ? filters.cats.filter((x) => x !== c.id) : [...filters.cats, c.id] })}>
                      {c.label}
                    </Chip>
                  );
                })}
              </View>
            </Section>

            <Section title="Bairro" value={filters.hood || "Todos"}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Chip active={!filters.hood} onPress={() => set({ hood: "" })}>
                  Todos
                </Chip>
                {[...new Set([...hoods, ...(filters.hood ? [filters.hood] : [])])].map((h) => (
                  <Chip key={h} active={filters.hood === h} onPress={() => set({ hood: filters.hood === h ? "" : h })}>
                    {h}
                  </Chip>
                ))}
              </View>
            </Section>

            <Section title="Preço" value={priceRangeLabel(filters)}>
              <View
                style={{ opacity: filters.onlyFree ? 0.35 : 1 }}
                pointerEvents={filters.onlyFree ? "none" : "auto"}
                onTouchStart={() => setScrollOn(false)}
                onTouchEnd={() => setScrollOn(true)}
                onTouchCancel={() => setScrollOn(true)}
              >
                <Slider
                  min={0}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  low={filters.priceMin}
                  high={filters.priceMax}
                  labels={["Preço mínimo", "Preço máximo"]}
                  format={(v) => (v >= PRICE_MAX ? `R$ ${PRICE_MAX} ou mais` : `R$ ${v}`)}
                  onChange={(priceMin, priceMax) => set({ priceMin, priceMax })}
                />
                <Row style={{ justifyContent: "space-between" }}>
                  <T size={12} color={C.muted}>R$ 0</T>
                  <T size={12} color={C.muted}>R$ {PRICE_MAX}+</T>
                </Row>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Chip active={filters.onlyFree} onPress={() => set({ onlyFree: !filters.onlyFree })}>
                  Só grátis
                </Chip>
              </View>
            </Section>

            <Section title="Classificação">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {AGE_OPTIONS.filter((o) => ages.includes(o.id)).map((o) => {
                  const on = filters.ages.includes(o.id);
                  return (
                    <Chip key={o.id} active={on} onPress={() => set({ ages: on ? filters.ages.filter((x) => x !== o.id) : [...filters.ages, o.id] })}>
                      {o.label}
                    </Chip>
                  );
                })}
              </View>
              {ages.length < 3 ? (
                <T size={12} color={C.muted}>
                  {age === null ? "Entra na sua conta pra ver os rolês da sua idade." : "Você vê os rolês permitidos pra sua idade."}
                </T>
              ) : null}
            </Section>

            <Section title="Distância" value={filters.distanceKm ? `até ${filters.distanceKm} km` : "Qualquer"}>
              <View onTouchStart={() => setScrollOn(false)} onTouchEnd={() => setScrollOn(true)} onTouchCancel={() => setScrollOn(true)}>
                <Slider
                  min={0}
                  max={DIST_MAX}
                  step={1}
                  high={filters.distanceKm}
                  labels={["", "Distância máxima"]}
                  format={(v) => (v ? `${v} quilômetros` : "qualquer distância")}
                  onChange={(_, distanceKm) => set({ distanceKm })}
                />
                <Row style={{ justifyContent: "space-between" }}>
                  <T size={12} color={C.muted}>Qualquer</T>
                  <T size={12} color={C.muted}>{DIST_MAX} km</T>
                </Row>
              </View>
              {needsLocation ? (
                <View style={{ backgroundColor: C.bg, borderRadius: R.md, padding: 12, gap: 10 }}>
                  <T size={13} color={C.muted}>
                    Pra filtrar e ordenar pela distância, a gente usa sua localização só agora. Nada é guardado.
                  </T>
                  <Button variant="ghost" loading={locBusy} onPress={askLocation}>
                    <Icon icon={LocateFixed} size={18} />
                    <T weight="semibold">Usar minha localização</T>
                  </Button>
                  {locErr ? <T size={13} color={C.danger}>{locErr}</T> : null}
                </View>
              ) : null}
            </Section>
            <View style={{ height: 8 }} />
          </ScrollView>

          <Row style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: `${C.line}99` }}>
            <Button variant="ghost" style={{ flex: 1 }} disabled={!n} onPress={clear}>
              Limpar filtros
            </Button>
            <Button style={{ flex: 1 }} onPress={onClose}>
              {resultCount === undefined ? "Ver rolês" : resultCount === 1 ? "Ver 1 rolê" : `Ver ${resultCount} rolês`}
            </Button>
          </Row>
        </View>
      </View>
    </Modal>
  );
}
