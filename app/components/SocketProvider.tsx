/* eslint-disable react-native/no-inline-styles */
import {
  createContext,
  JSX,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { Text, TouchableOpacity, View } from 'react-native';
import Spinner from 'react-native-spinkit';
import { WEB_APP_HOST } from './Define';
import Color from './Color';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SocketContext = createContext<{
  socket: Socket | null;
  receiverId: string | null;
  isConnected: boolean;
}>({
  socket: null,
  receiverId: null,
  isConnected: false,
});

export default function SocketProvider({
  children,
}: {
  children: JSX.Element | React.ReactNode;
}): JSX.Element {
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const timeoutConnecting = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isConnecting) {
      timeoutConnecting.current = setTimeout(() => {
        setIsConnecting(false);
      }, 10000);
    }
  }, [isConnecting]);

  const socket = useMemo(
    () =>
      io(`${WEB_APP_HOST}`, {
        path: '/copek-node/socket.io',
        transports: ['websocket'],
      }),
    [],
  );

  const handleReceiveChat = (chat: any) => {
    const data = {
      orderId: chat.orderId,
      sender: chat.sender,
      text: chat.text,
      dateTime: chat.dateTime,
    };
    AsyncStorage.getItem('chats', (_error, chats: any) => {
      if (chats !== null) {
        const newChats = JSON.parse(chats);
        const filterChat = newChats.filter(
          (c: any) =>
            c.orderId === data.orderId && c.dateTime === data.dateTime,
        );
        AsyncStorage.setItem('chats', JSON.stringify([...filterChat, data]));
      } else {
        AsyncStorage.setItem('chats', JSON.stringify([data]));
      }
    });
  };

  useEffect(() => {
    socket.on('connect', () => {
      setReceiverId(socket.id || null);
      setIsConnected(true);
      setIsConnecting(false);
      if (timeoutConnecting.current) clearTimeout(timeoutConnecting.current);
    });
    socket.on('disconnect', () => {
      setReceiverId(null);
      setIsConnected(false);
      setIsConnecting(true);
    });
    AsyncStorage.getItem('user_logged_in').then(v => {
      if (v) {
        const user = JSON.parse(v);
        socket.on(`${user.userId}_receive_chat`, handleReceiveChat);
      }
    });
    return () => {
      AsyncStorage.getItem('user_logged_in').then(v => {
        if (v) {
          const user = JSON.parse(v);
          socket.off(`${user.userId}_receive_chat`, handleReceiveChat);
          socket.disconnect();
        }
      });
    };
  }, [socket]);

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <SocketContext.Provider value={{ socket, receiverId, isConnected }}>
        {isConnected ? (
          children
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Color.white,
            }}
          >
            {isConnecting ? (
              <Spinner size={50} type="Circle" />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  socket.connect();
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  Coba lagi
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SocketContext.Provider>
    </View>
  );
}

export const useSocket = () => useContext(SocketContext);
