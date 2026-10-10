import { ItemModel } from './item-model';
export function FeatureEffect({ name }: { name: 'spawner' | 'jack_o_lantern' }) { return <ItemModel name={name==='spawner'?'spawner':'magma_cream'}/>; }
