type KingdomShopState = {
  market_stars: number;
  arsenal: number;
  penalty_until: string | null;
  shop_markup_percent: number;
} | null;

export function calculateKingdomShopMultiplier(state: KingdomShopState, now = new Date()) {
  if (!state) return 1;

  let multiplier = 1 - state.market_stars * 0.03;
  if (state.arsenal < 60) multiplier *= 1.035 ** (60 - state.arsenal);
  if (state.penalty_until && new Date(state.penalty_until) > now) {
    multiplier *= 1 + state.shop_markup_percent * 0.01;
  }

  return Math.max(0.01, multiplier);
}
