//@ts-nocheck
//@ts-nocheck
import { useMemo } from 'react';

export const useOutdatedCheck = (policyNo: string | undefined, list: any[]) => {
    return useMemo(() => {
        if (!list || !policyNo) return { isOutdated: false, isRenewed: false };

        const map = new Map(list.map(p => [p.proposalNo, p]));


        const normalizedPolicyNo = policyNo.trim().toUpperCase();

        // We check if ANY policy in the list claims to be a renewal of 'policyNo'
        // This is more robust than checking if policyNo exists in the map
        const isOutdated = list.some(p => p.coPolicyNo && p.coPolicyNo.trim().toUpperCase() === normalizedPolicyNo);

        // Logic for "Renewed" badge: !isOutdated && policy.coPolicyNo
        const currentPolicy = map.get(policyNo) || list.find(p => p.proposalNo && p.proposalNo.trim().toUpperCase() === normalizedPolicyNo);
        const isRenewed = !!(currentPolicy?.coPolicyNo);

        return { isOutdated, isRenewed };
    }, [policyNo, list]);
};
