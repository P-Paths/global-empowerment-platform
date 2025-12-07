'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface HotCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  demand: number;
  profit: number;
  location: string;
  trend: 'up' | 'down' | 'stable';
}

export default function HotCarsSection() {
  const [hotCars, setHotCars] = useState<HotCar[]>([]);

  useEffect(() => {
    // Mock data for demonstration
    setHotCars([
      {
        id: '1',
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        price: 18500,
        demand: 95,
        profit: 3200,
        location: 'Seattle, WA',
        trend: 'up'
      },
      {
        id: '2',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        price: 22500,
        demand: 88,
        profit: 2800,
        location: 'Austin, TX',
        trend: 'up'
      },
      {
        id: '3',
        make: 'Ford',
        model: 'F-150',
        year: 2018,
        price: 32000,
        demand: 92,
        profit: 4500,
        location: 'Denver, CO',
        trend: 'stable'
      },
      {
        id: '4',
        make: 'BMW',
        model: '3 Series',
        year: 2019,
        price: 28500,
        demand: 76,
        profit: 2200,
        location: 'Miami, FL',
        trend: 'down'
      }
    ]);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔥 Hot Cars of the Day</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
        These are the most in-demand cars in your area right now. High demand means faster sales and better profits.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotCars.map((car) => (
          <div key={car.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{car.year} {car.make} {car.model}</h4>
              {getTrendIcon(car.trend)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Price</p>
                <p className="font-semibold text-gray-900 dark:text-white">${car.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Demand</p>
                <p className="font-semibold text-green-600">{car.demand}%</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Profit</p>
                <p className="font-semibold text-blue-600">${car.profit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Location</p>
                <p className="font-semibold text-gray-900 dark:text-white">{car.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
