import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useGameLoop(username: string | null) {
    const { data, error, isLoading } = useSWR(
        `/api/game/status${username ? `?username=${username}` : ''}`,
        fetcher,
        {
            refreshInterval: 2000,
        }
    );

    return {
        gameState: data,
        isLoading,
        isError: error
    };
}
