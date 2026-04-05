import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '@connect/components/ui/Logo';
import LiveBanner from '@connect/components/home/LiveBanner';
import DailyVerse from '@connect/components/home/DailyVerse';
import QuickActions from '@connect/components/home/QuickActions';
import SermonCarousel from '@connect/components/home/SermonCarousel';
import UpcomingServices from '@connect/components/home/UpcomingServices';
import GivingCard from '@connect/components/home/GivingCard';
import { Skeleton } from '@connect/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }
  };

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('-date', 10)
  });

  const { data: sermons = [], isLoading: loadingSermons } = useQuery({
    queryKey: ['sermons'],
    queryFn: () => base44.entities.Sermon.list('-date', 6)
  });

  const liveService = services.find((s) => s.is_live);
  const upcomingServices = services.filter((s) => new Date(s.date) > new Date() && !s.is_live);
  const nextService = upcomingServices[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-transparent pt-6 pb-8 px-4 from-white to-gray-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6">

          <Logo size="lg" showTagline />
          {user &&
          <p className="text-gray-600 mt-4 text-sm">
              {getGreeting()}, <span className="font-medium">{user.full_name?.split(' ')[0] || 'hermano/a'}</span>
            </p>
          }
        </motion.div>

        {/* Live Banner */}
        {loadingServices ?
        <Skeleton className="h-40 rounded-2xl" /> :

        <LiveBanner
          isLive={!!liveService}
          liveService={liveService}
          nextService={nextService} />

        }
      </div>

      {/* Content */}
      <div className="px-4 space-y-6 pb-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Daily Verse */}
        <DailyVerse />

        {/* Upcoming Services */}
        {loadingServices ?
        <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div> :

        <UpcomingServices services={upcomingServices} />
        }

        {/* Sermons Carousel */}
        {loadingSermons ?
        <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-4">
              <Skeleton className="h-36 w-64 rounded-xl flex-shrink-0" />
              <Skeleton className="h-36 w-64 rounded-xl flex-shrink-0" />
            </div>
          </div> :

        <SermonCarousel sermons={sermons} />
        }

        {/* Giving Card */}
        <GivingCard />
      </div>
    </div>);

}