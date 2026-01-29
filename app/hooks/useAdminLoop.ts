import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useAdminLoop() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/admin/dashboard',
        fetcher,
        {
            refreshInterval: 2000,
        }
    );

    return {
        dashboard: data,
        isLoading,
        isError: error,
        mutate
    };
}
