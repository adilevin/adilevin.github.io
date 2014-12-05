# -*- coding: utf-8 -*-
"""
Created on Fri Oct 18 14:45:27 2013

@author: alevin
"""

import sqlite3

def get_counter():
    try:
        conn = sqlite3.connect('counter.db')
        c = conn.cursor()
        c.execute('SELECT total FROM thetable')
        x = c.fetchone()[0]
    except (sqlite3.OperationalError):
        return -1
    finally:        
        conn.close()
    return x
    
def increase_counter():
    try:
        conn = sqlite3.connect('counter.db')
        c = conn.cursor()
        c.execute('UPDATE thetable SET total = total + 1')
        conn.commit()
        conn.close()
        return True
    except (sqlite3.OperationalError):
        conn.close()
        return False    

def create_table():
    try:
        conn = sqlite3.connect('counter.db')
        c = conn.cursor()
        c.execute("""
        CREATE TABLE thetable
        (
        total int
        );
        """)
        c.execute("INSERT INTO thetable VALUES(0)")
        conn.commit()
    except (sqlite3.OperationalError):
        print('Table already exists');
    finally:
        conn.close()
    
if __name__=='__main__':
    if (not increase_counter()):
        create_table()
    print get_counter()
    