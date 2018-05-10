import { allRules, getRule } from './rules';
import syncRules from './sync';

export const sync = syncRules;
export const rules = allRules;
export const getRuleByModuleName = getRule;
