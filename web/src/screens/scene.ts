import { WORLDS } from '../course/course';
import type { Progress } from '../state/progress';
import type { SceneState } from '../ui/GameScene';

export function topicDone(p: Progress, id: string) {
  const t = WORLDS.flatMap(w => w.topics).find(x => x.id === id);
  return !!t && t.levels.length > 0 && t.levels.every(l => p.done[l.id]);
}

export function sceneOf(p: Progress): SceneState {
  return {
    heroName: p.hero.name,
    hasHero: !!p.hero.name,
    hasHp: !!p.hero.hp,
    chest: topicDone(p, 't05'),
    slime: topicDone(p, 't09'),
  };
}
