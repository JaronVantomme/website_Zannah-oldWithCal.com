export interface SelectedDayChange {
    date: Date;
    added: string[];
    removed: string[];
};

export interface Day {
    active: boolean;
    name: string;
    times: TimeInterval[];
    isOpen: boolean;
};

export interface TimeInterval {
    startTime: number;
    endTime: number;
};