import React from 'react';
import { useSelector } from 'react-redux';
import styles from '../../styles/styles';
import EventCard from './EventCard';

const Events = () => {
  const { allEvents = [], isLoading, error } = useSelector((state) => state.events);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.section}>
      <div className={styles.heading}>
        <h1>Popular Events</h1>
      </div>

      <div className="w-full grid">
        {allEvents.length > 0 ? (
          <EventCard data={allEvents[0]} />
        ) : (
          <h4>No Events available!</h4>
        )}
      </div>
    </div>
  );
};

export default Events;