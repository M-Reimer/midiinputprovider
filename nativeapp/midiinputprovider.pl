#!/usr/bin/perl
#    Firefox addon "MIDI Input Provider"
#    Copyright (C) 2017  Manuel Reimer <manuel.reimer@gmx.de>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.

use strict;
use warnings;
use IO::Handle;
use JSON::PP;

# This is a list of known MIDI messages.
# This is required to know how many data bytes follow the status byte
my %midi_messages = (
  0x8 => 2,
  0x9 => 2
);

sub GetMessage {
  read(STDIN, my $bytes, 4);
  my $length = unpack('L', $bytes);
  read(STDIN, my $json, $length);
  return decode_json($json);
}

sub SendMessage {
  my ($content) = @_;
  my $json = encode_json($content);
  print pack('L', length($json));
  print $json;
}

# Generates a list of MIDI devices.
sub ListDevices {
  opendir(my $dh, '/dev/snd') or die("No ALSA devices available?\n");
  my @mididevs = grep(/^midi/, readdir($dh));
  closedir($dh);

  my @devices;
  foreach my $id (@mididevs) {
    open(my $fh, '<', "/sys/class/sound/$id/device/id") or next;
    read($fh, my $name, -s $fh);
    close($fh);
    chomp($name);
    push(@devices, {id => $id, name => $name});
  }

  SendMessage(\@devices);
}

# Connects to device and watches MIDI messages.
sub ConnectMidi {
  my ($device) = @_;

  if ($device !~ /^midiC[0-9]+D[0-9]+$/) {
    die("Invalid device name in ConnectMidi: $device\n");
  }

  open(my $fh, '<', "/dev/snd/$device") or die("Can't open MIDI: $!\n");
  while(read($fh, my $byte, 1)) {
    $byte = ord($byte); # Convert character to byte

    # First bit is set --> Status byte
    if ($byte & 0b10000000) {
      my $status = $byte >> 4;
      next if ($status == 0xF);
      if (defined($midi_messages{$status})) {
        read($fh, my $data, $midi_messages{$status});
        my @bytes = ($byte, unpack('C*', $data));
        SendMessage(\@bytes);
      }
    }
  }
}

STDOUT->autoflush(1);
while(1) {
  my $message = GetMessage();
  if ($message->{command} eq 'list') {
    ListDevices();
    exit(0);
  }
  elsif ($message->{command} eq 'connect' && $message->{id}) {
    ConnectMidi($message->{id});
  }
  else {
    exit(1);
  }
}
