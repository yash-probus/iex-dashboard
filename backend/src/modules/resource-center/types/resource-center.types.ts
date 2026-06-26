export type ResourceType =
  | 'region-state'
  | 'discom-list'
  | 'ists-charges'
  | 'iex-fees'
  | 'prolt-margin'
  | 'ctu-charges'
  | 'stu-charges'
  | 'state-tariff';

export const isValidResourceType = (type: any): type is ResourceType => {
  const validTypes: ResourceType[] = [
    'region-state',
    'discom-list',
    'ists-charges',
    'iex-fees',
    'prolt-margin',
    'ctu-charges',
    'stu-charges',
    'state-tariff'
  ];
  return validTypes.includes(type as ResourceType);
};
