import { AppDispatch } from "@/redux/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Socket } from "socket.io-client";

type EventHandlers = Record<string, (...args: any[]) => void>;

const useSocketEvents = (socket: Socket, handlers: EventHandlers) => {
  useEffect(() => {
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, handlers]);
};

export const useAppDispatch = () => useDispatch<AppDispatch>();
export { useSocketEvents };