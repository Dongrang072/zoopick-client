import { useMutation, useQueryClient } from "@tanstack/react-query";
import { matchService } from "../../api/services/match";
import { MatchManualRequest } from "../../api/types";
import { MATCH_QUERY_KEYS } from "../queries/useMatchQueries";

export const useMatchMutations = {
  // 매칭 수락 → ConfirmMatchResult 반환
  useConfirmMatch: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (matchId: number) => matchService.confirmMatch(matchId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.myMatches });
      },
    });
  },

  // 매칭 거절
  useRejectMatch: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (matchId: number) => matchService.rejectMatch(matchId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.myMatches });
      },
    });
  },

  // 수동 매칭
  useManualMatch: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: MatchManualRequest) => matchService.manualMatch(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: MATCH_QUERY_KEYS.myMatches });
      },
    });
  },
};
