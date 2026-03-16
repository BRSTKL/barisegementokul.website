export type OrderStatus =
  | 'Received'
  | 'In Production'
  | 'In Transit'
  | 'At Customs'
  | 'Delivered'
  | 'Delayed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Order {
  id: string;
  customer: string;
  region: string;
  part: string;
  orderDate: string;
  estimatedDelivery: string;
  actualDelivery: string | null;
  status: OrderStatus;
  priority: Priority;
  value: number;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: 'SO-2026-001',
    customer: 'RWE AG',
    region: 'Germany',
    part: 'GT Vane Stage 1',
    orderDate: '2026-01-18',
    estimatedDelivery: '2026-02-06',
    actualDelivery: '2026-02-04',
    status: 'Delivered',
    priority: 'High',
    value: 64000,
  },
  {
    id: 'SO-2026-002',
    customer: 'E.ON SE',
    region: 'UK',
    part: 'Compressor Seal Kit',
    orderDate: '2026-01-22',
    estimatedDelivery: '2026-02-12',
    actualDelivery: '2026-02-15',
    status: 'Delivered',
    priority: 'Medium',
    value: 18500,
  },
  {
    id: 'SO-2026-003',
    customer: 'Uniper SE',
    region: 'Netherlands',
    part: 'Rotor Blade Set',
    orderDate: '2026-01-25',
    estimatedDelivery: '2026-02-08',
    actualDelivery: '2026-02-07',
    status: 'Delivered',
    priority: 'High',
    value: 72500,
  },
  {
    id: 'SO-2026-004',
    customer: 'ENGIE SA',
    region: 'France',
    part: 'Combustion Liner',
    orderDate: '2026-01-29',
    estimatedDelivery: '2026-02-22',
    actualDelivery: '2026-02-20',
    status: 'Delivered',
    priority: 'Medium',
    value: 38200,
  },
  {
    id: 'SO-2026-005',
    customer: 'Vattenfall',
    region: 'Sweden',
    part: 'IGV Actuator',
    orderDate: '2026-02-01',
    estimatedDelivery: '2026-02-24',
    actualDelivery: '2026-02-26',
    status: 'Delivered',
    priority: 'Low',
    value: 12100,
  },
  {
    id: 'SO-2026-006',
    customer: 'Fortum Oyj',
    region: 'Poland',
    part: 'Bearing Housing',
    orderDate: '2026-02-04',
    estimatedDelivery: '2026-02-18',
    actualDelivery: '2026-02-17',
    status: 'Delivered',
    priority: 'Medium',
    value: 27600,
  },
  {
    id: 'SO-2026-007',
    customer: 'CEZ Group',
    region: 'Germany',
    part: 'Turbine Disc',
    orderDate: '2026-02-07',
    estimatedDelivery: '2026-03-01',
    actualDelivery: '2026-02-28',
    status: 'Delivered',
    priority: 'High',
    value: 83400,
  },
  {
    id: 'SO-2026-008',
    customer: 'EnBW AG',
    region: 'Netherlands',
    part: 'Transition Piece',
    orderDate: '2026-02-10',
    estimatedDelivery: '2026-02-28',
    actualDelivery: '2026-03-02',
    status: 'Delivered',
    priority: 'Medium',
    value: 41700,
  },
  {
    id: 'SO-2026-009',
    customer: 'RWE AG',
    region: 'UK',
    part: 'GT Vane Stage 1',
    orderDate: '2026-02-12',
    estimatedDelivery: '2026-03-08',
    actualDelivery: '2026-03-06',
    status: 'Delivered',
    priority: 'High',
    value: 55200,
  },
  {
    id: 'SO-2026-010',
    customer: 'ENGIE SA',
    region: 'France',
    part: 'Compressor Seal Kit',
    orderDate: '2026-02-15',
    estimatedDelivery: '2026-03-10',
    actualDelivery: '2026-03-09',
    status: 'Delivered',
    priority: 'Low',
    value: 9600,
  },
  {
    id: 'SO-2026-011',
    customer: 'EnBW AG',
    region: 'Germany',
    part: 'Rotor Blade Set',
    orderDate: '2026-02-18',
    estimatedDelivery: '2026-03-22',
    actualDelivery: null,
    status: 'In Transit',
    priority: 'High',
    value: 78900,
  },
  {
    id: 'SO-2026-012',
    customer: 'CEZ Group',
    region: 'Poland',
    part: 'Transition Piece',
    orderDate: '2026-02-20',
    estimatedDelivery: '2026-03-19',
    actualDelivery: null,
    status: 'At Customs',
    priority: 'Medium',
    value: 33100,
  },
  {
    id: 'SO-2026-013',
    customer: 'Fortum Oyj',
    region: 'Sweden',
    part: 'Bearing Housing',
    orderDate: '2026-02-22',
    estimatedDelivery: '2026-03-25',
    actualDelivery: null,
    status: 'In Production',
    priority: 'Low',
    value: 14400,
  },
  {
    id: 'SO-2026-014',
    customer: 'Vattenfall',
    region: 'Netherlands',
    part: 'IGV Actuator',
    orderDate: '2026-02-24',
    estimatedDelivery: '2026-03-28',
    actualDelivery: null,
    status: 'Received',
    priority: 'Medium',
    value: 9800,
  },
  {
    id: 'SO-2026-015',
    customer: 'Uniper SE',
    region: 'Germany',
    part: 'Turbine Disc',
    orderDate: '2026-02-26',
    estimatedDelivery: '2026-03-24',
    actualDelivery: null,
    status: 'In Transit',
    priority: 'High',
    value: 60800,
  },
  {
    id: 'SO-2026-016',
    customer: 'RWE AG',
    region: 'France',
    part: 'Combustion Liner',
    orderDate: '2026-02-27',
    estimatedDelivery: '2026-03-17',
    actualDelivery: null,
    status: 'At Customs',
    priority: 'Critical',
    value: 44700,
  },
  {
    id: 'SO-2026-017',
    customer: 'E.ON SE',
    region: 'UK',
    part: 'Compressor Seal Kit',
    orderDate: '2026-02-28',
    estimatedDelivery: '2026-03-26',
    actualDelivery: null,
    status: 'In Production',
    priority: 'Medium',
    value: 17300,
  },
  {
    id: 'SO-2026-018',
    customer: 'ENGIE SA',
    region: 'France',
    part: 'GT Vane Stage 1',
    orderDate: '2026-03-01',
    estimatedDelivery: '2026-03-21',
    actualDelivery: null,
    status: 'Received',
    priority: 'Low',
    value: 69400,
  },
  {
    id: 'SO-2026-019',
    customer: 'CEZ Group',
    region: 'Poland',
    part: 'Transition Piece',
    orderDate: '2026-03-02',
    estimatedDelivery: '2026-03-23',
    actualDelivery: null,
    status: 'In Production',
    priority: 'High',
    value: 25500,
  },
  {
    id: 'SO-2026-020',
    customer: 'EnBW AG',
    region: 'Netherlands',
    part: 'Bearing Housing',
    orderDate: '2026-03-03',
    estimatedDelivery: '2026-03-27',
    actualDelivery: null,
    status: 'In Transit',
    priority: 'Medium',
    value: 22800,
  },
  {
    id: 'SO-2026-021',
    customer: 'Uniper SE',
    region: 'Germany',
    part: 'Rotor Blade Set',
    orderDate: '2026-02-05',
    estimatedDelivery: '2026-03-05',
    actualDelivery: null,
    status: 'Delayed',
    priority: 'High',
    value: 81200,
  },
  {
    id: 'SO-2026-022',
    customer: 'RWE AG',
    region: 'UK',
    part: 'Turbine Disc',
    orderDate: '2026-02-08',
    estimatedDelivery: '2026-03-09',
    actualDelivery: null,
    status: 'Delayed',
    priority: 'High',
    value: 74800,
  },
  {
    id: 'SO-2026-023',
    customer: 'Vattenfall',
    region: 'Sweden',
    part: 'Combustion Liner',
    orderDate: '2026-02-12',
    estimatedDelivery: '2026-03-14',
    actualDelivery: null,
    status: 'Delayed',
    priority: 'Critical',
    value: 51200,
  },
  {
    id: 'SO-2026-024',
    customer: 'E.ON SE',
    region: 'Poland',
    part: 'IGV Actuator',
    orderDate: '2026-02-18',
    estimatedDelivery: '2026-03-15',
    actualDelivery: null,
    status: 'Delayed',
    priority: 'Medium',
    value: 13400,
  },
  {
    id: 'SO-2026-025',
    customer: 'Fortum Oyj',
    region: 'Sweden',
    part: 'Compressor Seal Kit',
    orderDate: '2026-03-04',
    estimatedDelivery: '2026-03-24',
    actualDelivery: null,
    status: 'Received',
    priority: 'Low',
    value: 11800,
  },
  {
    id: 'SO-2026-026',
    customer: 'ENGIE SA',
    region: 'France',
    part: 'Transition Piece',
    orderDate: '2026-03-05',
    estimatedDelivery: '2026-03-29',
    actualDelivery: null,
    status: 'In Production',
    priority: 'Medium',
    value: 36100,
  },
  {
    id: 'SO-2026-027',
    customer: 'CEZ Group',
    region: 'Germany',
    part: 'GT Vane Stage 1',
    orderDate: '2026-03-06',
    estimatedDelivery: '2026-03-30',
    actualDelivery: null,
    status: 'At Customs',
    priority: 'High',
    value: 57600,
  },
  {
    id: 'SO-2026-028',
    customer: 'EnBW AG',
    region: 'Netherlands',
    part: 'Bearing Housing',
    orderDate: '2026-03-08',
    estimatedDelivery: '2026-03-31',
    actualDelivery: null,
    status: 'In Transit',
    priority: 'Medium',
    value: 16400,
  },
  {
    id: 'SO-2026-029',
    customer: 'RWE AG',
    region: 'Germany',
    part: 'Turbine Disc',
    orderDate: '2026-03-10',
    estimatedDelivery: '2026-04-05',
    actualDelivery: null,
    status: 'Received',
    priority: 'Low',
    value: 84500,
  },
  {
    id: 'SO-2026-030',
    customer: 'Uniper SE',
    region: 'Poland',
    part: 'IGV Actuator',
    orderDate: '2026-03-12',
    estimatedDelivery: '2026-04-08',
    actualDelivery: null,
    status: 'In Production',
    priority: 'Medium',
    value: 9200,
  },
];

export const calculateKPIs = (orders: Order[]) => {
  const active = orders.filter(o => !o.actualDelivery);
  const delivered = orders.filter(o => o.actualDelivery);
  const delayed = orders.filter(o => {
    if (o.actualDelivery) return false;
    return new Date(o.estimatedDelivery) < new Date();
  });
  const onTime = delivered.filter(o =>
    o.actualDelivery && new Date(o.actualDelivery) <= new Date(o.estimatedDelivery)
  );
  const avgDays = delivered.length > 0
    ? Math.round(delivered.reduce((acc, o) => {
        const diff = (new Date(o.actualDelivery!).getTime() - new Date(o.orderDate).getTime());
        return acc + diff / (1000 * 60 * 60 * 24);
      }, 0) / delivered.length)
    : 0;

  return {
    totalActive: active.length,
    onTimeRate: delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 0,
    delayedCount: delayed.length,
    avgProcessingDays: avgDays,
    totalValue: active.reduce((acc, o) => acc + o.value, 0),
    criticalCount: active.filter(o => o.priority === 'Critical').length,
  };
};

export const filterOrders = (orders: Order[], filters: {
  status: string;
  region: string;
  priority: string;
  search: string;
}): Order[] => {
  return orders.filter(order => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.region && order.region !== filters.region) return false;
    if (filters.priority && order.priority !== filters.priority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !order.id.toLowerCase().includes(q) &&
        !order.customer.toLowerCase().includes(q) &&
        !order.part.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });
};

export const isDelayed = (order: Order): boolean => {
  if (order.actualDelivery) return false;
  return new Date(order.estimatedDelivery) < new Date();
};

export const getDaysUntilDelivery = (order: Order): number => {
  const today = new Date();
  const est = new Date(order.estimatedDelivery);
  return Math.round((est.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
