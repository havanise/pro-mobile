/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import {propsEqual} from 'react-shallow-equal';
import { usePrevious } from './usePrevious';

/**
 * Filter helper hook
 * @param {{types: null}} filterVariants
 * @param {Function} callback
 */
export function useFilterHandle(filterVariants, callback) {
    const [filters, setFilters] = useState(filterVariants);
    const prevFilters = usePrevious(filters);

    const onFilter = useCallback((name, value = 'all') => {
        if (
            value === 'all' ||
            value === '' ||
            value === null ||
            value === undefined
        ) {
            setFilters(values => ({ ...values, [name]: undefined }));
        } else {
            setFilters(values => ({ ...values, [name]: value, 'history': undefined }));
        }
    }, []);

    useEffect(() => {
        if (!propsEqual(prevFilters||{}, filters)) {
            callback({ filters });
        }
    });

    return [filters, onFilter, setFilters];
}
