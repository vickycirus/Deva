// src/components/PatternTable.jsx

import React, { useEffect, useState } from 'react';
import { fetchPatterns } from '../services/api';

function PatternTable() {
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await fetchPatterns();
        setPatterns(data);
      } catch (error) {
        console.error('Failed to fetch patterns', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pattern-table">
      <h2>🚀 Ultra-Short Pattern Signals</h2>
      <table>
        <thead>
          <tr>
            <th>Stock</th>
            <th>Pattern</th>
            <th>Action</th>
            <th>Price</th>
            <th>Stop Loss</th>
            <th>Target</th>
            <th>Option</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {patterns.map((p) => (
            <tr key={p._id}>
              <td>{p.stockName}</td>
              <td>{p.patternName}</td>
              <td>{p.action}</td>
              <td>₹{p.price}</td>
              <td>₹{p.stopLoss}</td>
              <td>₹{p.target}</td>
              <td>{p.optionType}</td>
              <td>{new Date(p.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PatternTable;
