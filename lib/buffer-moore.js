// ref: https://gist.github.com/jhermsmeier/2138865
'use strict'

module.exports = {
  
  alphabetSize: 256,
  
  /*
    Returns the index of the first occurence of
    the `needle` buffer within the `haystack` buffer.
    
    @param {Buffer} needle
    @param {Buffer} haystack
    @return {Integer}
  */
  indexOf: function( needle, haystack, charTable, offsetTable ) {
    
    var i, k;
    var n = needle.length;
    var m = haystack.length;
    
    if( n === 0 ) return n;
    
    charTable = charTable || this.makeCharTable( needle );
    offsetTable = offsetTable || this.makeOffsetTable( needle );
    
    for( i = n - 1; i < m; ) {
      for( k = n - 1; needle[k] === haystack[i]; --i, --k ) {
        if( k === 0 ) return i;
      }
      // i += n - k; // for naive method
      i += Math.max( offsetTable[ n - 1 - k ], charTable[ haystack[i] ] );
    }
    
    return -1;
    
  },
  
  /*
    Makes the jump table based on the
    mismatched character information.
    
    @param {Buffer} needle
    @return {Buffer}
  */
  makeCharTable: function( needle ) {
    
    var table = new Uint32Array( this.alphabetSize );
    var n = needle.length;
    var t = table.length;
    var i = 0;
    
    for( ; i < t; ++i ) {
      table[i] = n;
    }
    
    n--;
    
    for( i = 0; i < n; ++i ) {
      table[ needle[i] ] = n - i;
    }
    
    return table;
    
  },
  
  /*
    Makes the jump table based on the
    scan offset which mismatch occurs.
    
    @param {Buffer} needle
  */
  makeOffsetTable: function( needle ) {
    
    var i, suffix;
    var n = needle.length;
    var m = n - 1;
    var lastPrefix = n;
    var table = new Uint32Array( n );
    
    for( i = m; i >= 0; --i ) {
      if( this.isPrefix( needle, i + 1 ) ) {
        lastPrefix = i + 1;
      }
      table[ m - i ] = lastPrefix - i + m;
    }
    
    for( i = 0; i < n; ++i ) {
      suffix = this.suffixLength( needle, i );
      table[ suffix ] = m - i + suffix;
    }
    
    return table;
    
  },
  
  /*
    Is `needle[i:end]` a prefix of `needle`?
    
    @param {Buffer} needle
    @param {Integer} i
  */
  isPrefix: function( needle, i ) {
    
    var k = 0;
    var n = needle.length;
    
    for( ; i < n; ++i, ++k ) {
      if( needle[i] !== needle[k] ) {
        return false;
      }
    }
    
    return true;
    
  },
  
  /*
    Returns the maximum length of the
    substring ends at `i` and is a suffix.
    
    @param {Buffer} needle
    @param {Integer} i
  */
  suffixLength: function( needle, i ) {
    
    var k = 0;
    var n = needle.length;
    var m = n - 1;
    
    for( ; i >= 0 && needle[i] === needle[m]; --i, --m ) {
      k += 1;
    }
    
    return k;
    
  }
  
};
