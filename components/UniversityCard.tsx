import React from 'react';
import { UniversityData } from '../types';
import { MapPin, TrendingUp, Users, Award, BookOpen, GraduationCap } from 'lucide-react';

interface UniversityCardProps {
  data: UniversityData;
}

export const UniversityCard: React.FC<UniversityCardProps> = ({ data }) => {
  const getRegionBadgeColor = (category: string) => {
    switch(category) {
      case 'SEOUL': return 'bg-indigo-100 text-indigo-700';
      case 'CAPITAL': return 'bg-emerald-100 text-emerald-700';
      case 'OTHER': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRegionLabel = (category: string) => {
    switch(category) {
      case 'SEOUL': return '서울';
      case 'CAPITAL': return '수도권';
      case 'OTHER': return '지방';
      default: return category;
    }
  };

  // Sort stats by year descending (e.g. 2025, 2024, ...)
  const sortedStats = [...data.stats].sort((a, b) => b.year - a.year);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRegionBadgeColor(data.regionCategory)}`}>
                {getRegionLabel(data.regionCategory)}
              </span>
              <span className="text-slate-500 text-xs flex items-center gap-0.5">
                 <MapPin size={10} /> {data.location}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{data.universityName}</h3>
            <h4 className="text-lg font-medium text-indigo-600">{data.departmentName}</h4>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.tags.map((tag, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-slate-500 mb-6 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Stats Grid (Iterate through available years) */}
        {sortedStats.map((stat, index) => (
          <div key={stat.year} className={`space-y-3 ${index > 0 ? 'mt-6 pt-6 border-t border-slate-100' : ''}`}>
            
            {/* Year Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                {stat.year}학년도
              </span>
              {index === 0 && <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">최신</span>}
            </div>
            
            {/* SuSi Row (수시) */}
            <div className="relative pl-3">
               <div className="absolute left-0 top-1 bottom-1 w-1 bg-blue-400 rounded-full"></div>
               <div className="grid grid-cols-3 gap-2">
                  {/* SuSi Quota */}
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-blue-600">
                        <BookOpen size={12} />
                        <span className="text-[10px] font-semibold">수시 모집</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{stat.quotaSuSi}명</p>
                  </div>
                  
                  {/* SuSi Competition */}
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-blue-600">
                        <TrendingUp size={12} />
                        <span className="text-[10px] font-semibold">수시 경쟁률</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{stat.competitionRateSuSi}:1</p>
                  </div>

                  {/* GPA Cutoff */}
                  <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center relative group">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-red-600">
                        <Award size={12} />
                        <span className="text-[10px] font-semibold">내신 70% 컷</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{stat.cutoffGPA}등급</p>
                  </div>
               </div>
            </div>

            {/* JeongSi Row (정시) */}
             <div className="relative pl-3">
               <div className="absolute left-0 top-1 bottom-1 w-1 bg-slate-400 rounded-full"></div>
               <div className="grid grid-cols-3 gap-2">
                  {/* JeongSi Quota */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-slate-600">
                        <Users size={12} />
                        <span className="text-[10px] font-semibold">정시 모집</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{stat.quotaJeongSi}명</p>
                  </div>
                  
                  {/* JeongSi Competition */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-slate-600">
                        <TrendingUp size={12} />
                        <span className="text-[10px] font-semibold">정시 경쟁률</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{stat.competitionRateJeongSi}:1</p>
                  </div>

                  {/* CSAT Cutoff */}
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5 text-emerald-600">
                        <GraduationCap size={12} />
                        <span className="text-[10px] font-semibold">수능 70% 컷</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{stat.cutoffCSAT}점</p>
                  </div>
               </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};