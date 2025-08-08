import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Gift,
  Star
} from 'lucide-react';

interface SetupProgressCardProps {
  overallProgress: number;
  completedSteps: string[];
  nextStep?: string;
  totalLocations: number;
  totalSpaces: number;
}

export function SetupProgressCard({ 
  overallProgress, 
  completedSteps, 
  nextStep,
  totalLocations,
  totalSpaces
}: SetupProgressCardProps) {
  const getProgressLevel = () => {
    if (overallProgress >= 100) return { 
      level: 'Expert', 
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: Trophy,
      message: '🎉 Congratulations! Your workspace is fully configured!'
    };
    if (overallProgress >= 75) return { 
      level: 'Advanced', 
      color: 'from-purple-500 to-indigo-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: Target,
      message: '🚀 Almost there! Just a few more steps to complete.'
    };
    if (overallProgress >= 50) return { 
      level: 'Getting There', 
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: Zap,
      message: '⚡ Great progress! You\'re building momentum.'
    };
    return { 
      level: 'Getting Started', 
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: Clock,
      message: '🌟 Welcome! Let\'s build something amazing together.'
    };
  };

  const progressLevel = getProgressLevel();
  const ProgressIcon = progressLevel.icon;

  const getReward = () => {
    if (overallProgress >= 100) return { icon: Gift, text: 'Premium Analytics Unlocked!' };
    if (overallProgress >= 75) return { icon: Sparkles, text: 'Advanced Features Coming Soon!' };
    if (overallProgress >= 50) return { icon: Star, text: 'Halfway Champion!' };
    return null;
  };

  const reward = getReward();
  const RewardIcon = reward?.icon;

  const achievements = [
    { id: 'company', label: 'Company Profile', completed: completedSteps.includes('company') },
    { id: 'locations', label: `${totalLocations} Location${totalLocations !== 1 ? 's' : ''}`, completed: totalLocations > 0 },
    { id: 'spaces', label: `${totalSpaces} Space${totalSpaces !== 1 ? 's' : ''}`, completed: totalSpaces > 0 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Gradient */}
      <div className={`bg-gradient-to-r ${progressLevel.color} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <ProgressIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Setup Progress</h3>
              <p className="text-sm opacity-90">{progressLevel.level} • {overallProgress}% Complete</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{overallProgress}%</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-sm opacity-90 mt-2">{progressLevel.message}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Achievements */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Achievements Unlocked</h4>
          <div className="space-y-2">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  achievement.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {achievement.completed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full opacity-50" />
                  )}
                </div>
                <span className={`text-sm ${
                  achievement.completed ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {achievement.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reward Section */}
        {reward && RewardIcon && (
          <div className={`${progressLevel.bgColor} rounded-lg p-4 mb-6`}>
            <div className="flex items-center space-x-2">
              <RewardIcon className={`h-5 w-5 ${progressLevel.textColor}`} />
              <span className={`text-sm font-medium ${progressLevel.textColor}`}>
                {reward.text}
              </span>
            </div>
          </div>
        )}

        {/* Next Step */}
        {nextStep && overallProgress < 100 && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Next Step</h4>
                <p className="text-sm text-blue-700">{nextStep}</p>
              </div>
              <Link
                to="/configure-spaces"
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
              >
                Continue
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {overallProgress >= 100 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Setup Complete!</h4>
            <p className="text-sm text-gray-600">Your workspace is ready to generate revenue</p>
          </div>
        )}
      </div>
    </div>
  );
}