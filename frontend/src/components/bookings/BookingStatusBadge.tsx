import React from 'react';
import { BookingStatus } from '../../types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case BookingStatus.APPROVED:
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-500',
          border: 'border-emerald-500/20',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
          label: 'Approved'
        };
      case BookingStatus.REJECTED:
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-500',
          border: 'border-rose-500/20',
          glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
          label: 'Rejected'
        };
      case BookingStatus.CANCELLED:
        return {
          bg: 'bg-gray-500/10',
          text: 'text-gray-500',
          border: 'border-gray-500/20',
          glow: 'shadow-[0_0_12px_rgba(107,114,128,0.3)]',
          label: 'Cancelled'
        };
      case BookingStatus.PENDING:
      default:
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-500',
          border: 'border-amber-500/20',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
          label: 'Pending'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        border transition-all duration-300
        ${styles.bg} ${styles.text} ${styles.border} ${styles.glow}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.text.replace('text', 'bg')} animate-pulse`} />
      {styles.label}
    </span>
  );
};

export default BookingStatusBadge;
