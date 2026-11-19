export function chooseVersionConfig(list, previous, historicalUnavailable) {
    if (historicalUnavailable)
        return '';
    return list.some(x => x.configId === previous) ? previous : list[0]?.configId || '';
}
export function unavailableTarget(target, kind) {
    return !!target && (target.serviceId !== 'ark-cn' || target.requestedModel !== (kind === 'image' ? 'doubao-seedream-5-0-flash-260915' : 'doubao-seedance-2-5-260628'));
}
