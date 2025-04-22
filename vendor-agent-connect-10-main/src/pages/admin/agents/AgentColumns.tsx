
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';

export const AgentColumns = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
  },
  {
    key: 'phone',
    header: 'Phone',
  },
  {
    key: 'region',
    header: 'Region',
    sortable: true,
  },
];
