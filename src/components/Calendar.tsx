import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Share2, Copy } from 'lucide-react';

interface CalendarProps {
  userName: string;
  sharedData: { [userName: string]: string[] } | null;
}

const Calendar: React.FC<CalendarProps> = ({ userName, sharedData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<{ [userName: string]: Date[] }>({});
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const userColors = useMemo(() => {
    const storedColors = localStorage.getItem('userColors');
    if (storedColors) {
      return JSON.parse(storedColors);
    }
    const colors: { [userName: string]: string } = {};
    Object.keys(selectedDates).forEach(user => {
      colors[user] = `hsl(${Math.random() * 360}, 70%, 50%)`;
    });
    localStorage.setItem('userColors', JSON.stringify(colors));
    return colors;
  }, []);

  useEffect(() => {
    if (sharedData) {
      const parsedDates: { [userName: string]: Date[] } = {};
      Object.entries(sharedData).forEach(([user, dates]) => {
        parsedDates[user] = dates.map(dateStr => new Date(dateStr));
      });
      setSelectedDates(parsedDates);
    } else {
      const storedDates = localStorage.getItem('selectedDates');
      if (storedDates) {
        setSelectedDates(JSON.parse(storedDates));
      }
    }
  }, [sharedData]);

  useEffect(() => {
    localStorage.setItem('selectedDates', JSON.stringify(selectedDates));
  }, [selectedDates]);

  const handlePrevMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = clickedDate.toISOString().split('T')[0];
    
    setSelectedDates(prevDates => {
      const userDates = prevDates[userName] || [];
      const index = userDates.findIndex(d => d.toISOString().split('T')[0] === dateString);
      
      if (index > -1) {
        const newUserDates = userDates.filter((_, i) => i !== index);
        return { ...prevDates, [userName]: newUserDates };
      } else {
        const newUserDates = [...userDates, clickedDate];
        return { ...prevDates, [userName]: newUserDates };
      }
    });
  };

  const generateShareUrl = () => {
    const sharableData: { [userName: string]: string[] } = {};
    Object.entries(selectedDates).forEach(([user, dates]) => {
      sharableData[user] = dates.map(date => date.toISOString());
    });
    const shareParams = new URLSearchParams({
      sharedData: encodeURIComponent(JSON.stringify(sharableData))
    });
    const url = `${window.location.origin}?${shareParams.toString()}`;
    setShareUrl(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' });
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getBackgroundColor = (usersCount: number, maxUsers: number) => {
    const minOpacity = 0.1;
    const maxOpacity = 0.9;
    const opacity = minOpacity + (maxOpacity - minOpacity) * (usersCount / maxUsers);
    return `rgba(59, 130, 246, ${opacity})`;  // Using Tailwind's blue-500 as base color
  };

  const getTopPreferredDates = () => {
    const dateCount: { [date: string]: number } = {};
    Object.values(selectedDates).flat().forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      dateCount[dateString] = (dateCount[dateString] || 0) + 1;
    });
    return Object.entries(dateCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([date, count]) => ({ date: new Date(date), count }));
  };

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-100"></div>);
    }

    const dateUsersCount: { [date: string]: string[] } = {};
    Object.entries(selectedDates).forEach(([user, dates]) => {
      dates.forEach(date => {
        const dateString = date.toISOString().split('T')[0];
        if (!dateUsersCount[dateString]) {
          dateUsersCount[dateString] = [];
        }
        dateUsersCount[dateString].push(user);
      });
    });

    const maxUsers = Math.max(...Object.values(dateUsersCount).map(users => users.length));

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const usersOnDate = dateUsersCount[dateString] || [];
      const backgroundColor = getBackgroundColor(usersOnDate.length, maxUsers);

      days.push(
        <div 
          key={day} 
          className={`h-24 border p-1 cursor-pointer`}
          style={{ backgroundColor }}
          onClick={() => handleDateClick(day)}
        >
          <div className="font-bold">{day}</div>
          {usersOnDate.map(user => (
            <div 
              key={user} 
              className="text-xs truncate" 
              style={{ color: userColors[user] || 'black' }}
            >
              {user}
            </div>
          ))}
        </div>
      );
    }
    return days;
  };

  const topPreferredDates = getTopPreferredDates();

  const renderSelectedDates = () => {
    const sortedUsers = Object.keys(selectedDates).sort((a, b) => 
      selectedDates[b].length - selectedDates[a].length
    );

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedUsers.map(user => (
          <div key={user} className="bg-gray-100 p-2 rounded">
            <p className="font-bold" style={{ color: userColors[user] }}>{user}</p>
            <p className="text-sm">{selectedDates[user].length} date(s)</p>
            <details>
              <summary className="cursor-pointer text-sm text-blue-500">Show dates</summary>
              <ul className="list-disc pl-5 text-xs">
                {selectedDates[user].map((date, index) => (
                  <li key={index}>{formatDate(date)}</li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h1>
        <div className="flex items-center">
          <span className="mr-4">Welcome, {userName}!</span>
          <button onClick={handlePrevMonth} className="mr-2 p-2 bg-gray-200 rounded"><ChevronLeft /></button>
          <button onClick={handleNextMonth} className="p-2 bg-gray-200 rounded"><ChevronRight /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-bold text-center">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {renderCalendarDays()}
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">Calendar Information</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Top 3 Preferred Dates:</h3>
          <ul className="list-disc pl-5">
            {topPreferredDates.map(({ date, count }, index) => (
              <li key={index} className="text-sm">
                {formatDate(date)} - {count} user{count !== 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
        <h3 className="text-lg font-semibold mb-2">Selected Dates by User:</h3>
        {renderSelectedDates()}
        <div className="mt-4">
          <button
            onClick={generateShareUrl}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 mr-2"
          >
            <Share2 className="inline-block mr-1" size={18} /> Generate Share URL
          </button>
          {shareUrl && (
            <button
              onClick={copyToClipboard}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300"
            >
              <Copy className="inline-block mr-1" size={18} /> 
              {copySuccess ? 'Copied!' : 'Copy URL'}
            </button>
          )}
        </div>
        {shareUrl && (
          <div className="mt-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="w-full p-2 border rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;