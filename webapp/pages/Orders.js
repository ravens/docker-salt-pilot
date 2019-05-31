/* eslint-disable no-script-url */

import React from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Title from './Title';

// Generate Order Data
function createData(id, date, name, shipTo, paymentMethod, amount) {
  return { id, date, name, shipTo, paymentMethod, amount };
}

const rows = [
  createData(0, '16 Mar, 2019', 'Cell site ALM', 'Operator 1', 'IPSec+LBO', 312.44),
  createData(1, '16 Mar, 2019', 'Cell site BCN', 'Operator 2', 'IPSec+SecurityGateway', 866.99),
  createData(2, '16 Mar, 2019', 'Cell site MAD', 'Operator 3', 'IPSec', 100.81),
  createData(3, '16 Mar, 2019', 'Cell site ZGZ', 'Operator 1', 'IPSec+LBO', 654.39),
  createData(4, '15 Mar, 2019', 'Cell site BOE', 'Operator 2', 'IPSec', 212.79),
];

const useStyles = makeStyles(theme => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
}));

export default function Orders() {
  const classes = useStyles();
  return (
    <React.Fragment>
      <Title>Last connections</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Site Name</TableCell>
            <TableCell>Owners</TableCell>
            <TableCell>Services</TableCell>
            <TableCell align="right">Traffic amount (GB)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.shipTo}</TableCell>
              <TableCell>{row.paymentMethod}</TableCell>
              <TableCell align="right">{row.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className={classes.seeMore}>
        <Link color="primary" href="javascript:;">
          See more links
        </Link>
      </div>
    </React.Fragment>
  );
}
