import { describe, it, expect } from 'vitest';
import { PredictionMarketABI, ERC20ABI } from './contracts';

describe('PredictionMarketABI', () => {
  const functionNames = PredictionMarketABI
    .filter((entry) => entry.type === 'function')
    .map((entry) => entry.name);

  it('exports the functions learners need for reading market data', () => {
    expect(functionNames).toContain('markets');
    expect(functionNames).toContain('totalMarkets');
    expect(functionNames).toContain('getOdds');
    expect(functionNames).toContain('hasVoted');
  });

  it('exports the functions learners need for writing transactions', () => {
    expect(functionNames).toContain('vote');
    expect(functionNames).toContain('createMarket');
    expect(functionNames).toContain('resolveMarket');
  });

  it('has the correct vote function signature (V2: marketId, side, amount)', () => {
    const vote = PredictionMarketABI.find(
      (entry) => entry.type === 'function' && entry.name === 'vote',
    );
    expect(vote).toBeDefined();
    if (vote && 'inputs' in vote) {
      expect(vote.inputs).toHaveLength(3);
      expect(vote.inputs[0].name).toBe('marketId');
      expect(vote.inputs[1].name).toBe('side');
      expect(vote.inputs[2].name).toBe('amount');
    }
  });

  it('markets() returns the expected struct shape', () => {
    const markets = PredictionMarketABI.find(
      (entry) => entry.type === 'function' && entry.name === 'markets',
    );
    expect(markets).toBeDefined();
    if (markets && 'outputs' in markets) {
      const outputNames = markets.outputs!.map((o) => o.name);
      expect(outputNames).toEqual(['question', 'yesPool', 'noPool', 'resolved', 'outcome']);
    }
  });
});

describe('ERC20ABI', () => {
  const functionNames = ERC20ABI
    .filter((entry) => entry.type === 'function')
    .map((entry) => entry.name);

  it('exports approve and transferFrom for the allowance pattern', () => {
    expect(functionNames).toContain('approve');
    expect(functionNames).toContain('transferFrom');
    expect(functionNames).toContain('allowance');
  });

  it('exports balanceOf for reading token balances', () => {
    expect(functionNames).toContain('balanceOf');
  });

  it('exports standard ERC-20 metadata functions', () => {
    expect(functionNames).toContain('name');
    expect(functionNames).toContain('symbol');
    expect(functionNames).toContain('decimals');
    expect(functionNames).toContain('totalSupply');
  });
});
